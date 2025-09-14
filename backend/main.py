from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse
import uuid
import os
from dotenv import load_dotenv
from SunoMusicGenerator import SunoMusicGenerator
from DataFromVideo import DataFromVideo
from VideoToMusic import prompt_gpt

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
    video_prompt = f"{answer}, DO NOT MAKE MUSIC LONGER THAN 1 MINUTE."
    tags = "background"
    suno = SunoMusicGenerator()
    suno.prompt_suno(video_prompt, tags)
    return {"message": "Success on creating the audio file."}
