# Nosu - HackMIT 2025 

<div align="center">
  <img alt="banner" width="600" height="600" alt="Image" src="https://github.com/user-attachments/assets/3334e6b0-d461-4e61-8419-e96713671f83" />
</div>

HackMIT 2025 - Nosu - AI Soundtracks for Every Scene

Turn any short video into a perfectly-timed soundtrack using computer vision + LLM prompting + generative music, then auto-merge into a shareable MP4.

What it does: analyzes the video (objects, captions, scene/action, audio sentiment analysis), crafts a concise music prompt using weights from the confidence of the descriptors for each time interval in the video, generates background music, and (optionally) mixes the track into the original clip (royalty & copyright free). 

Fully integrated with Firebase Auth, Firestore, and Storage.

## Video


## Tech Stack

### Frontend

- **React + Vite** - App Shell & Routing
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

### Backend

- **Python + FastAPI** - API server
- **MoviePy** - Audio/Video Muxing (H.264/AAC)
- **Hugging Face Transformers** - BLIP, VideoMAE; YOLOv5 for objects
- **OpenAI SDK** - Prompt Generation Helper
- **Suno API** - Music Generation

### Database

- **Firebase Firestore** - NoSQL Database
- **Firebase Authentication** - User Management
- **Firebase Storage** - File Storage

### AI Integration

- **Firebase Firestore** - NoSQL Database
- **Firebase Authentication** - User Management
- **Firebase Storage** - File Storage

<div align="center">
  <img alt="banner" width="800" height="800" alt="Image" src="https://github.com/user-attachments/assets/2d8e0e5f-dca1-4055-a6c6-dec9ca796073" />
</div>

## Installation

### Prerequisites

- Node.js (v18+)
- Python (3.10–3.12)
- Firebase account
- FFmpeg (for MoviePy): brew install ffmpeg (macOS)


## How It Works (End‑to‑End)

<div align="center">
  <img alt="banner" width="800" height="800" alt="Image" src="https://github.com/user-attachments/assets/83b0c84d-5f35-4eb6-935d-87bccc885121" />
</div>

1. Upload → Storage (frontend)
- User selects a video. Frontend uploads it to Firebase Storage under a deterministic path: users/{uid}/generations/{genId}/input.<ext>
- Frontend creates a Firestore job doc and triggers the backend with { uid, genId, inputPath, trackPath, aiVideoPath }.

2. Analyze Video (backend)
- YOLO object detection, BLIP captions, and VideoMAE scene tags produce CSVs (frames/objects, captions, scenes).

3. Craft Music Prompt (backend)
- The analysis is condensed into a short, clean music prompt (mood/genre/instrumentation; ≤ 60s).

4. Generate Music (backend)
- Calls Suno; polls until ready; downloads the MP3.

5. (Optional) Merge (backend)
- Loops/trims the MP3 to the video duration and muxes with MoviePy.

6. Download (frontend)
- User clicks Download Track (track.mp3) or Download AI Video (ai.mp4) via signed URLs.


## Firebase Database Schema

```plaintext
users/{uid}
└─ generations/{genId}
• title: string
• status: "queued" | "processing" | "audio_ready" | "complete" | "error"
• createdAt: serverTimestamp
• updatedAt: serverTimestamp
• normal_video: { storagePath, durationSec?, fps?, width?, height?, mimeType? }
• track: { storagePath, ready: boolean, duration?, codec?, bitrateKbps?, sampleRateHz?, clipId?, prompt? }
• ai_video: { storagePath, ready: boolean, durationSec?, codec?, audioCodec?, sizeBytes?, mux? }
• analysis: {
objects_csv: { storagePath, rows }
captions_csv: { storagePath, rows }
scenes_csv: { storagePath, rows }
summary?: { top_objects[], top_scenes[], sample_caps[] }
music_prompt?: string
}
• progress?: number
• errors?: [ { stage, message, ts } ]
```

Canonical Storage Paths

```plaintext
users/{uid}/generations/{genId}/input.<ext>
users/{uid}/generations/{genId}/analysis/frame_metadata.csv
users/{uid}/generations/{genId}/analysis/detail_frame_metadata.csv
users/{uid}/generations/{genId}/analysis/scene_timeline.csv
users/{uid}/generations/{genId}/track.mp3
users/{uid}/generations/{genId}/ai.mp4
```

## Project Structure

```plaintext
project/
├─ src/
│ ├─ components/ # Reusable UI
│ ├─ pages/ # Landing, Auth, Upload, Generate, Dashboard
│ ├─ services/ # Firebase SDK wrappers, API client
│ ├─ hooks/ # Auth/file upload hooks
│ ├─ firebase.js # Client config & ensureUserDoc
│ └─ App.jsx # Router + PrivateRoute
├─ backend/
│ ├─ main.py # FastAPI app (entrypoint)
│ ├─ DataFromVideo.py # YOLO/BLIP/VideoMAE analysis
│ ├─ VideoToMusic.py # prompt crafting + MoviePy merge
│ ├─ SunoMusicGenerator.py
│ ├─ requirements.txt
│ └─ firebase-credentials.json (local only, not committed)
└─ public/ # Static assets
```

## Features

- Email/Google Auth with Firebase
- Upload & Track Jobs with Firestore + Storage
- Computer Vision Analysis (objects, captions, scenes)
- LLM Prompting for music description
- Suno Integration for AI soundtrack generation
- Optional Mux (loop/trim audio, background volume, H.264/AAC output)
- Downloads of track and final video
- Dashboard history view ordered by last update


## Contributing

1. Fork the repository  
2. Create a feature branch (`git checkout -b feature/amazing-feature`)  
3. Commit your changes (`git commit -m 'Add some amazing feature'`)  
4. Push to the branch (`git push origin feature/amazing-feature`)  
5. Open a Pull Request  

## License

This project is licensed under the MIT License - see the LICENSE file for details.
