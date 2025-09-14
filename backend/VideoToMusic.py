import os
from openai import OpenAI
from dotenv import load_dotenv
from DataFromVideo import DataFromVideo
from SunoMusicGenerator import SunoMusicGenerator
from moviepy.editor import VideoFileClip, AudioFileClip, CompositeAudioClip, afx


def prompt_gpt(
    instructions: str, user_input: str, key: str, model: str = "gpt-3.5-turbo"
) -> str:
    """
    Send a prompt to GPT using the new Responses API.

    Args:
        instructions: System-level instructions (e.g., "You are a helpful assistant.")
        user_input: The user's question or prompt
        model: The model to use (default: gpt-4o)

    Returns:
        The response text from GPT
    """
    client = OpenAI(api_key=key)

    response = client.responses.create(
        model=model, instructions=instructions, input=user_input
    )

    # Extract text output (supports multi-part messages)
    # response.output_text is a shortcut for the full text
    return response.output_text


def merge_music_and_video(video_path="", audio_path=""):
    video = VideoFileClip(video_path)
    video_duration = video.duration

    background_audio = AudioFileClip(audio_path)
    # Loop or trim
    background_audio = (
        afx.audio_loop(background_audio, duration=video_duration)
        if background_audio.duration < video_duration
        else background_audio.subclip(0, video_duration)
    )
    background_audio = background_audio.volumex(0.5)

    final_video = video.set_audio(background_audio)

    # print("Video audio:", final_audio.duration)
    print("Background audio duration:", background_audio.duration)

    final_video.write_videofile(
        "output_video.mp4",
        codec="libx264",
        audio_codec="aac",
        temp_audiofile="temp-audio.m4a",
        remove_temp=True,
        preset="medium",
        fps=video.fps,
        audio=True,
    )


# Example usage
if __name__ == "__main__":
    instructions = """
You are a coding assistant that converts scene descriptions into short prompts for SUNO AI background music generation.
Keep responses concise (1-2 sentences per scene, under 200 characters).
Focus only on mood, genre, and instrumentation. Avoid long explanations.
Output only the music prompt text, nothing else.
"""
    video_path = "/home/bkhwaja/hackathons/Mit_Hacks/backend/test/videos/beach.mp4"
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
    clip_id = suno.prompt_suno(video_prompt, tags)
    audio_path = f"backend/test/downloads/{clip_id}.mp3"
    merge_music_and_video(video_path, audio_path)
    # return {"message": "Success on creating the audio file."}
