from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
import uuid
import os
import pandas as pd
from dotenv import load_dotenv
from SunoMusicGenerator import SunoMusicGenerator
from DataFromVideo import DataFromVideo
from VideoToMusic import prompt_gpt, merge_music_and_video
from audioAnalysis import analyze_audio_segments, save_sentiment_data, extract_audio_16k_mono_to_temp
import time
import tempfile

app = FastAPI()


@app.get("/")
def root():
    return {"message": "Welcome to the NoSu API!"}


@app.post("/video-to-music/")
async def video_to_music():
    instructions = """
You are a coding assistant that converts scene descriptions into short prompts for SUNO AI background music generation.
Keep responses concise (1 sentences per scene, under 50 characters).
Focus only on mood, genre, and instrumentation. Avoid long explanations.
Output only the music prompt text, nothing else.
"""
    video_path = "/home/bkhwaja/hackathons/Mit_Hacks/backend/test/videos/sekiro.mp4"
    meta_data = DataFromVideo()
    result_list = meta_data.analyze_video(video_path, step=120)
    detail_list = meta_data.detail_analyze_video(video_path, step=120)
    timeline = meta_data.scene_understanding_timeline(video_path, chunk_seconds=5)
    user_input = (
        f"objects={result_list}, scene labels={detail_list}, action labels={timeline}"
    )
    # Initialize client
    load_dotenv(".env.local")
    key = os.environ.get("GPT_KEY")
    answer = prompt_gpt(instructions, user_input, key)
    print(answer)
    video_prompt = answer
    tags = "background"
    suno = SunoMusicGenerator()
    suno.prompt_suno(video_prompt, tags)
    return {"message": "Success on creating the audio file."}


@app.post("/video-to-video/")
async def video_to_video():
    instructions = """
You are a coding assistant that converts scene descriptions and audio mood analysis into short prompts for SUNO AI background music generation.

IMPORTANT: Apply confidence-weighted prioritization to keywords:
- Scene labels with higher confidence scores should be weighted more heavily
- Audio mood analysis with higher confidence scores should be prioritized
- Combine both visual and audio cues, but emphasize the most confident predictions
- If confidence scores are low (<0.3), de-emphasize those elements
- If confidence scores are high (>0.7), make those the primary focus

Keep responses concise (1-2 sentences per scene, under 200 characters).
Focus only on mood, genre, and instrumentation. Avoid long explanations.
Output only the music prompt text, nothing else.
"""
    video_path = 'test/videos/beach_audio.mp4'
    
    print("=" * 60)
    print("STARTING INTEGRATED VIDEO + AUDIO ANALYSIS")
    print("=" * 60)
    
    # 1. Video Analysis (Image Processing)
    print("\n1. Running Video Analysis...")
    meta_data = DataFromVideo()
    result_list = meta_data.analyze_video(video_path, step=120)
    detail_list = meta_data.detail_analyze_video(video_path, step=120)
    timeline = meta_data.scene_understanding_timeline(video_path, chunk_seconds=5)
    print(f"   ✓ Video analysis complete: {len(result_list)} objects, {len(detail_list)} scenes, {len(timeline)} timeline chunks")
    
    # 2. Audio Analysis (Mood Detection)
    print("\n2. Running Audio Analysis...")
    audio_results = None
    audio_csv_path = None
    tmp_audio = None
    
    try:
        # Extract audio from video
        tmp_audio = extract_audio_16k_mono_to_temp(video_path)
        print(f"   ✓ Audio extracted to: {tmp_audio}")
        
        # Analyze audio segments
        audio_results = analyze_audio_segments(tmp_audio, num_segments=4)
        print(f"   ✓ Audio analysis complete: {len(audio_results)} segments analyzed")
        
        # Save audio analysis to CSV
        audio_csv_path = save_sentiment_data(audio_results, video_path)
        print(f"   ✓ Audio CSV saved to: {audio_csv_path}")
        
    except Exception as e:
        print(f"   ✗ Audio analysis failed: {e}")
        audio_results = []
    
    # 3. Prepare Combined Data for GPT
    print("\n3. Preparing Combined Analysis Data...")
    
    user_input = f"""
VIDEO ANALYSIS DATA:
- Objects detected: {result_list}
- Scene descriptions: {detail_list}  
- Action/scene timeline with confidence: {timeline}

AUDIO ANALYSIS DATA:
"""
    
    if audio_results:
        user_input += f"- Audio mood analysis: {audio_results}"
    else:
        user_input += "- Audio mood analysis: Not available"
    
    user_input += """

CONFIDENCE WEIGHTING INSTRUCTIONS:
- Prioritize scene labels with confidence > 0.7
- Emphasize audio moods with confidence > 0.6  
- De-emphasize predictions with confidence < 0.3
- Combine visual and audio cues, weighting by confidence scores
- Create a cohesive music prompt that reflects the most confident predictions
"""
    
    # 4. Generate Music Prompt with GPT
    print("\n4. Generating Music Prompt with GPT...")
    load_dotenv(".env.local")
    key = os.environ.get("GPT_KEY")
    answer = prompt_gpt(instructions, user_input, key)
    print(f"   ✓ GPT Response: {answer}")
    
    # 5. Generate Music with Suno
    print("\n5. Generating Music with Suno...")
    video_prompt = answer
    tags = "background"
    suno = SunoMusicGenerator()
    clip_id = suno.prompt_suno(video_prompt, tags)
    audio_path = f"test/downloads/{clip_id}.mp3"
    
    # 6. Wait for audio and merge with video
    print("\n6. Merging Music with Video...")
    timeout = 60
    waited = 0
    while not os.path.exists(audio_path) and waited < timeout:
        print(f"   Waiting for audio file {audio_path} to be created...")
        time.sleep(2)
        waited += 2

    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found after waiting: {audio_path}")
    
    merge_music_and_video(video_path, audio_path)
    print("   ✓ Video with music created successfully!")
    
    # Cleanup
    if tmp_audio and os.path.exists(tmp_audio):
        try:
            os.remove(tmp_audio)
        except:
            pass
    
    print("\n" + "=" * 60)
    print("ANALYSIS COMPLETE!")
    print("=" * 60)
    
    return {
        "message": "Success on creating the audio file.",
        "video_analysis": {
            "objects": len(result_list),
            "scenes": len(detail_list), 
            "timeline_chunks": len(timeline)
        },
        "audio_analysis": {
            "segments": len(audio_results) if audio_results else 0,
            "csv_path": audio_csv_path
        },
        "gpt_prompt": answer
    }