#!/usr/bin/env python3
'''
Test file to run both audio analysis and image generation on the same video file
'''

import os
import sys
from DataFromVideo import DataFromVideo
from audioAnalysis import analyze_audio_segments, save_sentiment_data, extract_audio_16k_mono_to_temp
from VideoToMusic import prompt_gpt
from SunoMusicGenerator import SunoMusicGenerator
from dotenv import load_dotenv

def run_complete_analysis(video_path):
    print('=' * 60)
    print('COMPLETE VIDEO ANALYSIS PIPELINE')
    print('=' * 60)
    print(f'Video: {video_path}')
    
    if not os.path.exists(video_path):
        print(f'ERROR: Video file not found: {video_path}')
        return
    
    # 1. Video Analysis (3 CSV files)
    print('\n1. Running Video Analysis...')
    meta_data = DataFromVideo()
    result_list = meta_data.analyze_video(video_path, step=120)
    detail_list = meta_data.detail_analyze_video(video_path, step=120)
    timeline = meta_data.scene_understanding_timeline(video_path, chunk_seconds=5)
    print('✓ Video analysis complete')
    
    # 2. Audio Analysis
    print('\n2. Running Audio Analysis...')
    tmp_audio = extract_audio_16k_mono_to_temp(video_path)
    if tmp_audio:
        audio_results = analyze_audio_segments(tmp_audio, num_segments=4)
        audio_csv_path = save_sentiment_data(audio_results, video_path)
        print('Audio analysis complete')
    else:
        audio_results = []
        audio_csv_path = None
        print('No audio found, skipping audio analysis')
    
    # 3. Generate GPT Prompt
    print('\n3. Generating GPT Prompt...')
    instructions = '''You are a coding assistant that converts scene descriptions and audio mood analysis into short prompts for SUNO AI background music generation.

IMPORTANT: Apply confidence-weighted prioritization to keywords:
- Scene labels with higher confidence scores should be weighted more heavily
- Audio mood analysis with higher confidence scores should be prioritized
- Combine both visual and audio cues, but emphasize the most confident predictions
- If confidence scores are low (<0.2), de-emphasize those elements
- If confidence scores are high (>0.6), make those the primary focus

Keep responses concise (1 sentences per scene, under 50 characters).
Focus only on mood, genre, and instrumentation. Avoid long explanations.
Output only the music prompt text, nothing else.'''
    
    user_input = f'''VIDEO ANALYSIS DATA:
- Objects detected: {result_list}
- Scene descriptions: {detail_list}  
- Action/scene timeline with confidence: {timeline}

AUDIO ANALYSIS DATA:
- Audio mood analysis: {audio_results}

CONFIDENCE WEIGHTING INSTRUCTIONS:
- Prioritize scene labels with confidence > 0.6
- Emphasize audio moods with confidence > 0.6  
- De-emphasize predictions with confidence < 0.2
- Combine visual and audio cues, weighting by confidence scores
- Create a cohesive music prompt that reflects the most confident predictions'''
    
    # Get GPT response
    load_dotenv('.env.local')
    key = os.environ.get('GPT_KEY')
    if key:
        gpt_response = prompt_gpt(instructions, user_input, key)
        print(f'GPT Response: {gpt_response}')
        
        # 4. Generate Music with Suno
        print('\n4. Generating Music with Suno...')
        suno = SunoMusicGenerator()
        clip_id = suno.prompt_suno(gpt_response, 'background')
        print(f'Music generated! Clip ID: {clip_id}')
        
        # Check if audio file was created
        audio_path = f'test/downloads/{clip_id}.mp3'
        if os.path.exists(audio_path):
            print(f'Audio file created: {audio_path}')
            print(f'File size: {os.path.getsize(audio_path) / (1024*1024):.1f} MB')
        else:
            print('Audio file not found yet, may still be processing...')
    else:
        print('No GPT key found, skipping GPT and Suno generation')
    
    # Cleanup
    if tmp_audio and os.path.exists(tmp_audio):
        os.remove(tmp_audio)
    
    print('\nComplete pipeline finished!')
    return {
        'video_analysis': {
            'objects': len(result_list),
            'scenes': len(detail_list), 
            'timeline_chunks': len(timeline)
        },
        'audio_analysis': {
            'segments': len(audio_results) if audio_results else 0,
            'csv_path': audio_csv_path
        },
        'gpt_response': gpt_response if key else None
    }

if __name__ == '__main__':
    # Default video path
    video_path = 'test/videos/beach_audio.mp4'
    
    # Allow command line argument
    if len(sys.argv) > 1:
        video_path = sys.argv[1]
    
    result = run_complete_analysis(video_path)
    print('\nFinal Result:', result)

