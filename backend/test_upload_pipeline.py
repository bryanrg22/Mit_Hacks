
import asyncio
import os
import shutil
from main import video_to_video

async def test_video_upload_pipeline():
    print('=' * 60)
    print('TESTING VIDEO UPLOAD PIPELINE')
    print('=' * 60)
    
    # Simulate frontend video upload
    video_path = 'test/videos/beach.mp4'
    
    if not os.path.exists(video_path):
        print(f'ERROR: Video file not found: {video_path}')
        return
    
    print(f'✓ Video uploaded: {video_path}')
    print(f'✓ File size: {os.path.getsize(video_path) / (1024*1024):.1f} MB')
    
    # Run the complete pipeline
    print('\nRunning complete analysis pipeline...')
    try:
        result = await video_to_video()
        print('\n' + '=' * 60)
        print('PIPELINE SUCCESS!')
        print('=' * 60)
        print(f'Result: {result}')
        
        # Check generated files
        print('\nGenerated Files:')
        csv_files = [f for f in os.listdir('.') if f.endswith('.csv')]
        for csv in csv_files:
            print(f'  ✓ {csv}')
            
        audio_csv_dir = 'test/audioData'
        if os.path.exists(audio_csv_dir):
            audio_csvs = [f for f in os.listdir(audio_csv_dir) if f.endswith('.csv')]
            for csv in audio_csvs:
                print(f'  ✓ {audio_csv_dir}/{csv}')
        
        if os.path.exists('output_video.mp4'):
            print(f'  ✓ output_video.mp4 ({os.path.getsize(\
output_video.mp4\) / (1024*1024):.1f} MB)')
            
    except Exception as e:
        print(f'\n✗ Pipeline failed: {e}')
        import traceback
        traceback.print_exc()

# Run the test
asyncio.run(test_video_upload_pipeline())

