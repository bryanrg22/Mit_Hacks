import asyncio
import os
from main import video_to_video

async def test():
    print('Testing video upload pipeline...')
    video_path = 'test/videos/beach.mp4'
    
    if not os.path.exists(video_path):
        print(f'ERROR: Video not found: {video_path}')
        return
    
    print(f'Video found: {video_path}')
    print(f'Size: {os.path.getsize(video_path) / (1024*1024):.1f} MB')
    
    try:
        result = await video_to_video()
        print('SUCCESS!')
        print(f'Result: {result}')
    except Exception as e:
        print(f'FAILED: {e}')

asyncio.run(test())
