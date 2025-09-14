import os
import requests
import json
import time
from typing import Optional, Dict, Any
from dotenv import load_dotenv


class SunoMusicGenerator:
    def __init__(self):
        """
        Initialize the Suno Music Generator.

        Args:
            api_key: Suno API key. If None, will try to get from SUNO_API_KEY environment variable.
            base_url: Base URL for the Suno API. Defaults to the HackMIT endpoint you had.
        """
        # Recommended: set via env var instead of hardcoding
        load_dotenv(".env.local")

        self.api_key = os.environ.get("SUNO_API_KEY")
        if not self.api_key:
            raise ValueError(
                "SUNO_API_KEY not found in environment variables or provided directly"
            )

        self.base_url = "https://studio-api.prod.suno.com/api/v2/external/hackmit"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        self.download_dir = "test/downloads"
        os.makedirs(self.download_dir, exist_ok=True)

    def generate_music(
        self,
        prompt: str,
        tags: Optional[str] = None,
        make_instrumental: bool = True,
        poll_interval: float = 3.0,
        timeout: float = 120.0,
    ) -> Dict[str, Any]:
        """
        Generate music using Suno API and download audio when ready.

        Args:
            prompt: The topic/prompt for music generation
            tags: Optional tags for the music style
            make_instrumental: Whether to make instrumental music
            poll_interval: seconds between status polls
            timeout: total seconds to wait for rendered audio

        Returns:
            Dictionary containing the API response plus local_path when audio downloaded.
        """
        if not prompt or prompt.strip() == "":
            raise ValueError("Prompt is required")

        payload = {"topic": prompt, "make_instrumental": make_instrumental}
        if tags:
            payload["tags"] = tags

        try:
            response = requests.post(
                f"{self.base_url}/generate",
                headers=self.headers,
                json=payload,
                timeout=30,
            )

            if not response.ok:
                raise requests.RequestException(
                    f"Failed to start song generation: {response.status_code}: {response.text}"
                )

            clip = response.json()
            print(f"Suno API response: {json.dumps(clip, indent=2)}")

            clip_id = clip.get("id")
            if not clip_id:
                raise ValueError("Invalid response from Suno API: missing 'id'")

            # Poll for completion and attempt to download audio
            ready_clip = self._poll_for_clip(
                clip_id, poll_interval=poll_interval, timeout=timeout
            )

            # Attempt to extract an audio URL from the ready clip object
            audio_url = self._extract_audio_url_from_clip(ready_clip)
            if not audio_url:
                return {
                    "success": True,
                    "clips": [
                        {
                            "id": clip_id,
                            "status": ready_clip.get("status"),
                            "created_at": ready_clip.get("created_at"),
                        }
                    ],
                    "download_error": "No audio URL found in clip metadata. Inspect clip object.",
                }

            local_path = self._download_file_from_url(audio_url, clip_id)
            return {
                "success": True,
                "clips": [
                    {
                        "id": clip_id,
                        "status": ready_clip.get("status"),
                        "created_at": ready_clip.get("created_at"),
                        "local_path": local_path,
                    }
                ],
            }

        except requests.RequestException as e:
            print(f"Generate music error: {e}")
            raise
        except Exception as e:
            print(f"Unexpected error: {e}")
            raise

    def _poll_for_clip(
        self, clip_id: str, poll_interval: float = 3.0, timeout: float = 120.0
    ) -> Dict[str, Any]:
        """
        Poll the clip endpoint until it's ready or timeout.


        Returns the latest clip JSON response.
        """
        t0 = time.time()
        last_clip = {}
        tried_endpoints = [
            f"{self.base_url}/clips?ids={clip_id}",
        ]
        time.sleep(5)
        while True:
            for endpoint in tried_endpoints:
                try:
                    r = requests.get(endpoint, headers=self.headers, timeout=15)
                    if r.ok:
                        clip = r.json()
                        last_clip = clip
                        # print(clip)
                        output = clip[0]
                        status = output.get("status")
                        print(f"status={status}")
                        if status == "complete":
                            return output
                except Exception as e:
                    print(f"Polling endpoint {endpoint} error: {e}")

            # check timeout
            if time.time() - t0 > timeout:
                print("Polling timed out. Returning last clip object.")
                return last_clip

            time.sleep(poll_interval)

    def _extract_audio_url_from_clip(self, clip: Dict[str, Any]) -> Optional[str]:
        """
        Try to find an audio / download URL in a clip object by checking common fields.
        Modify this function if the Suno docs specify a particular field name.
        """
        # Direct fields

        candidate = clip.get("audio_url")
        if candidate and isinstance(candidate, str) and candidate.startswith("https"):
            return candidate

        return None

    def _download_file_from_url(self, url: str, clip_id: str) -> str:
        """
        Stream-download a file from URL to downloads/<clip_id>.<ext>
        Guesses extension from content-type or URL path.
        """
        try:
            with requests.get(url, stream=True, timeout=60) as r:
                r.raise_for_status()
                content_type = r.headers.get("content-type", "")
                # Determine extension heuristically
                ext = None
                if "audio/mpeg" in content_type or url.lower().endswith(".mp3"):
                    ext = "mp3"
                elif "wav" in content_type or url.lower().endswith(".wav"):
                    ext = "wav"
                elif "mpeg" in content_type:
                    ext = "mp3"
                elif ".ogg" in url.lower() or "ogg" in content_type:
                    ext = "ogg"
                else:
                    # fallback: try to infer from URL path
                    path = url.split("?")[0]
                    if "." in path:
                        ext = path.split(".")[-1].split("/")[0]
                    else:
                        ext = "bin"

                filename = os.path.join(self.download_dir, f"{clip_id}.{ext}")
                with open(filename, "wb") as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
            print(f"Downloaded audio to {filename}")
            return filename
        except Exception as e:
            print(f"Error downloading file from {url}: {e}")
            raise

    def prompt_suno(self, prompt="", tags=""):
        try:
            # generator = SunoMusicGenerator()
            # prompt = "A relaxing jazz song about a rainy evening, hard stop at 15 seconds"
            # tags = "jazz, chill, piano"
            make_instrumental = True

            result = self.generate_music(
                prompt=prompt,
                tags=tags,
                make_instrumental=make_instrumental,
                poll_interval=3.0,
                timeout=180.0,  # wait up to 3 minutes
            )

            print("Music generation completed!")
            clip_info = result["clips"][0]
            print(f"Clip ID: {clip_info['id']}")
            print(f"Status: {clip_info.get('status')}")
            if "local_path" in clip_info:
                print(f"Audio saved to: {clip_info['local_path']}")
            else:
                if "download_error" in result:
                    print("Download error:", result["download_error"])
                else:
                    print("Audio not downloaded — inspect clip metadata for audio URL.")
        except ValueError as e:
            print(f"Input error: {e}")
        except requests.RequestException as e:
            print(f"API error: {e}")
        except Exception as e:
            print(f"Unexpected error: {e}")

        return clip_info["id"]

    def remix_suno(covera_clip_id=""):
        pass


if __name__ == "__main__":
    prompt = "A relaxing jazz song about a rainy evening, hard stop at 15 seconds"
    tags = "jazz, chill, piano"
    suno = SunoMusicGenerator
    suno.prompt_suno(prompt, tags)
