import torch
import pandas as pd
import cv2
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration

class DataFromVideo:
    def __init__(self) -> None:
        self.yolo = torch.hub.load("ultralytics/yolov5", "yolov5s", pretrained=True, trust_repo=True)
        self.processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
        self.blip = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")

    def analyze_video(self,video_path, step=30, output_csv="frame_metadata.csv"):
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_num = 0
        results_list = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_num % step == 0:  # process every Nth frame
                # Run detection
                results = self.yolo(frame)

                # Convert to pandas DataFrame
                df = results.pandas().xyxy[0]  
                print(f"Frame {frame_num} → {len(df)} detections")
                for _, row in df.iterrows():
                    results_list.append({
                        "frame": frame_num,
                        "timestamp_sec": frame_num / fps,
                        "class": row["name"],
                        # "confidence": float(row["confidence"]),
                    })

            frame_num += 1

        cap.release()

        # Save all metadata to CSV
        df_results = pd.DataFrame(results_list)
        df_results.to_csv(output_csv, index=False)
        print(f"Saved metadata for {len(df_results)} detections → {output_csv}")
        return results_list

    def detail_analyze_video(self,video_path, step=30, output_csv="detail_frame_metadata.csv"):
        """
        Extract scene-level captions from a video using BLIP.

        Args:
            video_path: Path to input video
            step: Process every Nth frame
            output_csv: CSV to save frame metadata
        """
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_num = 0
        results_list = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_num % step == 0:
                # Convert OpenCV frame (BGR) to PIL Image (RGB)
                pil_frame = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

                # Run BLIP captioning
                inputs = self.processor(pil_frame, return_tensors="pt")
                with torch.no_grad():
                    out = self.blip.generate(**inputs)
                caption = self.processor.decode(out[0], skip_special_tokens=True)

                # Save metadata
                results_list.append({
                    "frame": frame_num,
                    "timestamp_sec": frame_num / fps,
                    "caption": caption
                })

                print(f"Frame {frame_num} → Caption: {caption}")

            frame_num += 1

        cap.release()

        # Save to CSV
        df_results = pd.DataFrame(results_list)
        df_results.to_csv(output_csv, index=False)
        print(f"Saved metadata for {len(results_list)} frames → {output_csv}")
        return results_list

# video_path = "/home/bkhwaja/hackathons/Mit_Hacks/backend/test/videos/beach.mp4"
# meta_data = DataFromVideo()
# result_list = meta_data.analyze_video(video_path, step=30)
# detail_list = meta_data.detail_analyze_video(video_path, step=30)