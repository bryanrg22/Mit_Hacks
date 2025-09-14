from moviepy.editor import VideoFileClip, AudioFileClip, CompositeAudioClip, afx

video = VideoFileClip(
    "/home/bkhwaja/hackathons/Mit_Hacks/backend/test/videos/beach.mp4"
)
video_duration = video.duration

background_audio = AudioFileClip(
    "/home/bkhwaja/hackathons/Mit_Hacks/backend/test/downloads/5bcdd292-4d2f-4189-af89-f10168dbc5f6.mp3"
)
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
