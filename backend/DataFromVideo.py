import torch
import pandas as pd
import cv2
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
from transformers import VideoMAEImageProcessor, VideoMAEForVideoClassification
import numpy as np
import os


class DataFromVideo:
    def __init__(self) -> None:
        self.yolo = torch.hub.load(
            "ultralytics/yolov5", "yolov5s", pretrained=True, trust_repo=True
        )
        self.processor = BlipProcessor.from_pretrained(
            "Salesforce/blip-image-captioning-base"
        )
        self.blip = BlipForConditionalGeneration.from_pretrained(
            "Salesforce/blip-image-captioning-base"
        )

        # Load VideoMAE for scene/action recognition
        self.video_processor = VideoMAEImageProcessor.from_pretrained(
            "MCG-NJU/videomae-base-finetuned-kinetics"
        )
        self.videomae = VideoMAEForVideoClassification.from_pretrained(
            "MCG-NJU/videomae-base-finetuned-kinetics"
        )

    def analyze_video(self, video_path, step=60, output_csv="frame_metadata.csv"):
        # Create imageData directory path
        image_data_dir = os.path.join("test", "imageData")
        os.makedirs(image_data_dir, exist_ok=True)
        
        # Create full path for CSV file
        csv_filepath = os.path.join(image_data_dir, output_csv)
        
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
                    results_list.append(
                        {
                            "frame": frame_num,
                            "timestamp_sec": frame_num / fps,
                            "class": row["name"],
                            # "confidence": float(row["confidence"]),
                        }
                    )

            frame_num += 1

        cap.release()

        # Save all metadata to CSV
        df_results = pd.DataFrame(results_list)
        df_results.to_csv(csv_filepath, index=False)
        print(f"Saved metadata for {len(df_results)} detections → {csv_filepath}")
        return results_list

    def detail_analyze_video(
        self,
        video_path,
        step=60,
        output_csv="detail_frame_metadata.csv",
        human_in_loop=False,
    ):
        """
        Extract scene-level captions from a video using BLIP, with optional human review.

        Args:
            video_path: Path to input video
            step: Process every Nth frame
            output_csv: CSV to save frame metadata
            human_in_loop: If True, prompt user to review/edit captions
        """
        # Create imageData directory path
        image_data_dir = os.path.join("test", "imageData")
        os.makedirs(image_data_dir, exist_ok=True)
        
        # Create full path for CSV file
        csv_filepath = os.path.join(image_data_dir, output_csv)
        
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_num = 0
        results_list = []

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_num % step == 0:
                pil_frame = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                inputs = self.processor(pil_frame, return_tensors="pt")
                with torch.no_grad():
                    out = self.blip.generate(**inputs)
                caption = self.processor.decode(out[0], skip_special_tokens=True)

                if human_in_loop:
                    print(f"\nFrame {frame_num} → BLIP Caption: {caption}")
                    user_caption = input(
                        "Edit caption or press Enter to accept: "
                    ).strip()
                    if user_caption:
                        caption = user_caption

                results_list.append(
                    {
                        "frame": frame_num,
                        "timestamp_sec": frame_num / fps,
                        "caption": caption,
                    }
                )

                print(f"Frame {frame_num} → Final Caption: {caption}")

            frame_num += 1

        cap.release()
        df_results = pd.DataFrame(results_list)
        df_results.to_csv(csv_filepath, index=False)
        print(f"Saved metadata for {len(results_list)} frames → {csv_filepath}")
        return results_list

    def scene_understanding_timeline(
        self,
        video_path,
        chunk_seconds=5,
        num_frames=16,
        output_csv="scene_timeline.csv",
    ):
        """
        Classify dynamic actions/scenes over time using VideoMAE.
        Splits the video into chunks (e.g., 10s) and predicts one label per chunk.

        Args:
            video_path: path to video file
            chunk_seconds: length of each chunk (default 10s)
            num_frames: number of frames sampled per chunk
            output_csv: where to save results
        """
        # Create imageData directory path
        image_data_dir = os.path.join("test", "imageData")
        os.makedirs(image_data_dir, exist_ok=True)
        
        # Create full path for CSV file
        csv_filepath = os.path.join(image_data_dir, output_csv)
        
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        video_duration = total_frames / fps

        results_list = []

        # process each chunk
        chunk_start = 0
        while chunk_start < video_duration:
            start_frame = int(chunk_start * fps)
            end_frame = int(min((chunk_start + chunk_seconds) * fps, total_frames - 1))
            frame_indices = np.linspace(start_frame, end_frame, num_frames, dtype=int)

            frames = []
            for idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                ret, frame = cap.read()
                if ret:
                    frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    frames.append(frame)

            if frames:
                inputs = self.video_processor(frames, return_tensors="pt")
                with torch.no_grad():
                    outputs = self.videomae(**inputs)
                    logits = outputs.logits
                    predicted_class = logits.argmax(-1).item()
                    
                    # Calculate confidence score using softmax
                    probabilities = torch.softmax(logits, dim=-1)
                    confidence = probabilities[0][predicted_class].item()

                label = self.videomae.config.id2label[predicted_class]
                print(
                    f"Chunk {chunk_start:.1f}s–{chunk_start+chunk_seconds:.1f}s → {label} (confidence: {confidence:.3f})"
                )

                results_list.append(
                    {
                        "start_sec": chunk_start,
                        "end_sec": min(chunk_start + chunk_seconds, video_duration),
                        "scene_label": label,
                        "confidence": round(confidence, 3),
                    }
                )

            chunk_start += chunk_seconds

        cap.release()

        df_results = pd.DataFrame(results_list)
        df_results.to_csv(csv_filepath, index=False)
        print(f"Saved {len(results_list)} scene chunks → {csv_filepath}")
        return results_list


# video_path = "/home/bkhwaja/hackathons/Mit_Hacks/backend/test/videos/beach.mp4"
# meta_data = DataFromVideo()
# result_list = meta_data.analyze_video(video_path, step=30)
# detail_list = meta_data.detail_analyze_video(video_path, step=30)