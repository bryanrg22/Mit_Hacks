#!/usr/bin/env python3
"""
Video -> Audio (auto) -> Mood/Sentiment (CLAP zero-shot, with default labels)
No user-provided labels required.

- Input:  a video file (e.g., .mp4)
- Output: ranked list of {label, score} aggregated over short windows

Why this design?
- CLAP handles speech + ambient.
- Default label set lives here (one place), not user-facing.
- Windowed scoring (+ median aggregation) makes results stable and dynamic-aware.

Deps:
  pip install torch transformers moviepy librosa soundfile
Note:
  Ensure ffmpeg is installed (moviepy uses it).

Usage:
  python audioAnalysis.py test/videos/beach_audio.mp4 [num_segments]
"""

import os
import io
import sys
import json
import tempfile
import csv
from typing import List, Tuple, Dict
from datetime import datetime

import numpy as np
import librosa
import soundfile as sf
import torch
from transformers import pipeline
from moviepy.video.io.VideoFileClip import VideoFileClip

# ---------------------- Config ----------------------
MODEL_NAME = "laion/clap-htsat-unfused"  # CLAP zero-shot
SAMPLE_RATE = 16000
WIN_SEC = 5.0
HOP_SEC = 2.5

# Default moods (edit if you want, end users don't need to pass anything)
DEFAULT_LABELS = [
    "calm", "serene", "ambient", "relaxing", "peaceful",
    "neutral", "energetic", "tense", "joyful", "sad",
    "angry", "dark", "bright", "here ca", "melancholic"
]

HYPOTHESIS = "The audio is {}."  # zero-shot template


def extract_audio_16k_mono_to_temp(video_path: str) -> str:
    """
    Extract audio from video to a temporary 16 kHz mono WAV and return its path.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(video_path)

    clip = VideoFileClip(video_path)
    if clip.audio is None:
        clip.close()
        raise RuntimeError("Video has no audio track.")

    # 1) demux to temp wav (16k) via moviepy/ffmpeg
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t1:
        tmp_wav_rough = t1.name
    clip.audio.write_audiofile(tmp_wav_rough, fps=SAMPLE_RATE)
    clip.close()

    # 2) ensure mono 16k (robust) via librosa + soundfile
    y, sr = librosa.load(tmp_wav_rough, sr=SAMPLE_RATE, mono=True)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t2:
        tmp_wav = t2.name
    sf.write(tmp_wav, y.astype(np.float32), samplerate=SAMPLE_RATE)

    try:
        os.remove(tmp_wav_rough)
    except Exception:
        pass

    return tmp_wav


def score_labels_windowed_with_clap(audio_path: str,
                                    labels: List[str],
                                    hypothesis: str,
                                    sr: int = SAMPLE_RATE,
                                    win_sec: float = WIN_SEC,
                                    hop_sec: float = HOP_SEC):
    """
    1) Load audio 16 kHz mono
    2) Loudness normalize
    3) Slide windows -> CLAP zero-shot scores per window
    4) Aggregate median score per label
    Returns: (per_label_scores_sorted, debug_windows)
    """
    device = 0 if torch.cuda.is_available() else -1
    clf = pipeline("zero-shot-audio-classification", model=MODEL_NAME, device=device)

    y, _ = librosa.load(audio_path, sr=sr, mono=True)
    if len(y) == 0:
        return [{"label": "silence", "score": 1.0}], []

    # Loudness normalize (simple RMS target) to reduce volume bias
    rms = np.sqrt(np.mean(y**2) + 1e-12)
    if rms > 0:
        y = y / rms * 0.1  # ~ -20 dBFS

    # Quick silence guard
    if np.mean(np.abs(y)) < 1e-3:
        return [{"label": "silence", "score": 1.0}], []

    win = int(win_sec * sr)
    hop = int(hop_sec * sr)
    n = len(y)

    per_label_scores = {lab: [] for lab in labels}
    debug_windows = []

    for start in range(0, max(1, n - win + 1), hop):
        seg = y[start:start+win]
        if len(seg) < int(0.6 * win):
            break  # ignore too-short tail

        out = clf(seg.astype(np.float32),
                  candidate_labels=labels, hypothesis_template=hypothesis)

        # Normalize output variants to list of (label, score)
        if isinstance(out, dict) and "labels" in out and "scores" in out:
            window_scores = list(zip(out["labels"], out["scores"]))
        elif isinstance(out, list):
            window_scores = [(d["label"], d["score"]) for d in out]
        else:
            window_scores = [(out.get("label", "unknown"), out.get("score", 0.0))]

        # log a tiny debug record (optional)
        t0 = start / sr; t1 = (start + win) / sr
        debug_windows.append({
            "t0": round(t0, 2),
            "t1": round(t1, 2),
            "top": sorted(window_scores, key=lambda x: -x[1])[:3]
        })

        # accumulate by label
        for lab, sc in window_scores:
            if lab in per_label_scores:
                per_label_scores[lab].append(float(sc))

    # aggregate with median (robust to spikes)
    med = []
    for lab in labels:
        scores = per_label_scores.get(lab, [])
        med.append({"label": lab, "score": float(np.median(scores)) if scores else 0.0})

    med.sort(key=lambda d: d["score"], reverse=True)
    return med, debug_windows


def analyze_audio_segments(audio_path: str, num_segments: int = 4) -> List[Dict]:
    """
    Split audio into equal segments and analyze each segment separately.
    Returns list of results for each segment with timestamps.
    """
    # Load audio to get duration
    y, sr = librosa.load(audio_path, sr=SAMPLE_RATE, mono=True)
    duration = len(y) / sr
    segment_duration = duration / num_segments
    
    print(f"Audio duration: {duration:.1f}s, splitting into {num_segments} segments of {segment_duration:.1f}s each")
    
    segment_results = []
    
    for i in range(num_segments):
        start_time = i * segment_duration
        end_time = (i + 1) * segment_duration
        
        # Extract segment
        start_sample = int(start_time * sr)
        end_sample = int(end_time * sr)
        segment_audio = y[start_sample:end_sample]
        
        # Save segment to temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_file:
            segment_path = tmp_file.name
        sf.write(segment_path, segment_audio.astype(np.float32), samplerate=SAMPLE_RATE)
        
        try:
            # Analyze this segment
            results, _ = score_labels_windowed_with_clap(
                segment_path,
                labels=DEFAULT_LABELS,
                hypothesis=HYPOTHESIS
            )
            
            # Get top 2 moods for this segment
            top_mood = results[0] if results else {"label": "unknown", "score": 0.0}
            top_2_mood = results[1] if len(results) > 1 else {"label": "unknown", "score": 0.0}
            
            segment_info = {
                "segment": i + 1,
                "start_time": round(start_time, 2),
                "end_time": round(end_time, 2),
                "duration": round(segment_duration, 2),
                "top_mood": top_mood["label"],
                "top_2_mood": top_2_mood["label"],
                "confidence": round(top_mood["score"], 3),
                "confidence_2": round(top_2_mood["score"], 3),
                "all_moods": results[:3],  # Top 3 moods for this segment
                "timestamp": datetime.now().isoformat()
            }
            
            segment_results.append(segment_info)
            
        finally:
            # Clean up segment file
            try:
                os.remove(segment_path)
            except:
                pass
    
    return segment_results


def save_sentiment_data(segment_results: List[Dict], video_path: str):
    """
    Save sentiment analysis results with timestamps to CSV file in the audioData folder.
    """
    # Create audioData directory path
    audio_data_dir = os.path.join("test", "audioData")
    os.makedirs(audio_data_dir, exist_ok=True)
    
    # Generate output filename based on video path
    base_name = os.path.splitext(os.path.basename(video_path))[0]
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_filename = f"{base_name}_sentiment_{timestamp_str}.csv"
    
    # Full path to save the CSV file
    csv_filepath = os.path.join(audio_data_dir, csv_filename)
    
    with open(csv_filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        # Write header
        writer.writerow([
            'segment', 'start_time', 'end_time', 'duration', 
            'top_mood', 'confidence', 'top_2_mood', 'confidence_2',
            'mood_3', 'score_3', 'analysis_timestamp'
        ])
        
        # Write data rows
        for segment in segment_results:
            moods = segment['all_moods']
            writer.writerow([
                segment['segment'],
                segment['start_time'],
                segment['end_time'],
                segment['duration'],
                segment['top_mood'],
                segment['confidence'],
                segment['top_2_mood'],
                segment['confidence_2'],
                moods[2]['label'] if len(moods) > 2 else '',
                moods[2]['score'] if len(moods) > 2 else '',
                segment['timestamp']
            ])
    
    print(f"Sentiment data saved to: {csv_filepath}")
    return csv_filepath


def main():
    if len(sys.argv) < 2:
        print("Usage: python audioAnalysis.py /path/to/video.mp4 [num_segments]")
        print("  num_segments: Number of segments to split audio into (default: 4)")
        sys.exit(1)

    video_path = sys.argv[1]
    num_segments = int(sys.argv[2]) if len(sys.argv) > 2 else 4
    
    if not os.path.exists(video_path):
        print(f"[ERROR] File not found: {video_path}")
        sys.exit(1)

    tmp_audio = None
    try:
        # 1) Extract audio automatically
        tmp_audio = extract_audio_16k_mono_to_temp(video_path)

        # 2) Analyze audio in segments
        segment_results = analyze_audio_segments(tmp_audio, num_segments)

        # 3) Print segment analysis results
        print(f"\nAUDIO MOOD ANALYSIS - {num_segments} SEGMENTS")
        print("=" * 50)
        
        for segment in segment_results:
            print(f"\nSegment {segment['segment']} ({segment['start_time']:.1f}s - {segment['end_time']:.1f}s):")
            print(f"  Top Mood: {segment['top_mood']} (confidence: {segment['confidence']:.3f})")
            print(f"  Second Mood: {segment['top_2_mood']} (confidence: {segment['confidence_2']:.3f})")
            print(f"  Top 3: ", end="")
            for j, mood in enumerate(segment['all_moods']):
                print(f"{mood['label']}({mood['score']:.3f})", end="")
                if j < 2:
                    print(", ", end="")
            print()

        # 4) Summary timeline
        print(f"\nMOOD TIMELINE SUMMARY:")
        print("=" * 30)
        for segment in segment_results:
            print(f"{segment['start_time']:.1f}s-{segment['end_time']:.1f}s: {segment['top_mood']} | {segment['top_2_mood']}")

        # 5) Save sentiment data to CSV
        print(f"\nSAVING SENTIMENT DATA...")
        print("=" * 30)
        csv_file = save_sentiment_data(segment_results, video_path)
        print(f"Analysis complete! Data saved to: {csv_file}")

    finally:
        if tmp_audio and os.path.exists(tmp_audio):
            try:
                os.remove(tmp_audio)
            except Exception:
                pass


if __name__ == "__main__":
    main()