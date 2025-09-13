import os
from openai import OpenAI
from dotenv import load_dotenv
from DataFromVideo import DataFromVideo
from SunoMusicGenerator import SunoMusicGenerator




def prompt_gpt(instructions: str, user_input: str, key: str, model: str = "gpt-3.5-turbo") -> str:
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
        model=model,
        instructions=instructions,
        input=user_input
    )
    
    # Extract text output (supports multi-part messages)
    # response.output_text is a shortcut for the full text
    return response.output_text

# Example usage
if __name__ == "__main__":
  instructions = "You are a coding assistant that takes in data about information about the scenes to prompt SUNO ai for background music. Keep this short"
  video_path = "/home/bkhwaja/hackathons/Mit_Hacks/backend/test/videos/beach.mp4"
  meta_data = DataFromVideo()
  result_list = meta_data.analyze_video(video_path, step=30)
  detail_list = meta_data.detail_analyze_video(video_path, step=30)
  user_input = f"{result_list}, {detail_list}"
  # Initialize client
  load_dotenv(".env.local")
  key = os.environ.get("GPT_KEY")
  answer = prompt_gpt(instructions, user_input, key)
  print(answer)
  video_prompt = f"{answer}, DO NOT MAKE MUSIC LONGER THAN 1 MINUTE."
  tags = "vlog, background"
  suno = SunoMusicGenerator()
  suno.prompt_suno(video_prompt, tags)
