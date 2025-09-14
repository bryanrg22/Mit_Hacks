"use client"

import { useState, useEffect, useRef } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Play, Pause, Download, RefreshCw, Volume2, AudioWaveform as Waveform, Sparkles } from "lucide-react"

import { storage } from "../lib/firebase"
import { ref, getDownloadURL } from "firebase/storage"

import { auth, db } from "../lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth";


const GeneratePage = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const videoFile     = location.state?.videoFile
  const genId         = location.state?.genId
  const trackPath     = location.state?.trackPath
  const aiVideoPath   = location.state?.aiVideoPath
  const generationDoc = location.state?.generationDoc // when opened from Dashboard

  const [resolvedTrackPath, setResolvedTrackPath] = useState(
    trackPath || generationDoc?.track?.storagePath || null
  )
  const [resolvedAIVideoPath, setResolvedAIVideoPath] = useState(
    aiVideoPath || generationDoc?.ai_video?.storagePath || null
  )

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(180) // 3 minutes
  const [generating, setGenerating] = useState(true)
  const [generatedTrack, setGeneratedTrack] = useState(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [projectName, setProjectName] = useState(generationDoc?.title || "Epic Adventure Theme")
  const audioRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const triggerDownload = async (path, suggestedName) => {
  if (!path) { alert("No file available to download yet."); return }
  try {
    const url = await getDownloadURL(ref(storage, path))
    const a = document.createElement("a")
    a.href = url
    a.download = suggestedName || path.split("/").pop() || "download"
    document.body.appendChild(a)
    a.click()
    a.remove()
  } catch (err) {
    console.error("Download failed:", err)
    alert("File is not ready yet. Try again in a moment.")
  }
}
const handleDownloadTrack = () =>
  triggerDownload(resolvedTrackPath, `${projectName || "track"}.mp3`)
const handleDownloadAIVideo = () =>
  triggerDownload(resolvedAIVideoPath, `${projectName || "video"}.mp4`)
  

  useEffect(() => {
    if (!videoFile && !genId && !generationDoc) {
      navigate("/upload")
    }
  }, [videoFile, genId, generationDoc, navigate])

  useEffect(() => {
    // If opened from Upload flow, we have uid implicitly via auth on backend.
    // Here we listen to the generation doc using the uid embedded in Storage path.
    // Prefer: when you navigate here from Dashboard, pass the whole doc as "generationDoc".
    const path = generationDoc ? generationDoc._path?.segments : null
    // Fallback: derive uid/genId from resolved Storage paths if needed (optional).
    if (!generationDoc && !genId) return
  
    // If you open from Dashboard, you can pass uid in location.state; otherwise
    // you can keep a "userUid" in your dashboard router state. For now we assume
    // Generate opened from Upload flow; only genId is needed because Dashboard opens with generationDoc.
    const uid = generationDoc?.uid // (optional if you embed it)
    if (!uid && !generationDoc) return
  
    const dref = generationDoc
      ? doc(db, "users", generationDoc.uid, "generations", generationDoc.id)
      : doc(db, "users", auth.currentUser.uid, "generations", genId)
  
    const unsub = onSnapshot(dref, (snap) => {
      if (!snap.exists()) return
      const data = snap.data()
      // enable download buttons when ready flags flip true
      if (data?.track?.ready || data?.ai_video?.ready) {
        setGenerating(false)
      }
    })
    return () => unsub()
  }, [genId, generationDoc])
    
  useEffect(() => {
    let unsubAuth;
    let unsubDoc;
  
    unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user || !genId) return;
      const uid = user.uid;
      const dref = doc(db, "users", uid, "generations", genId);
  
      unsubDoc = onSnapshot(dref, (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
  
        // Flip UI when backend marks files ready
        if (data?.track?.ready || data?.ai_video?.ready) {
          setGenerating(false);
        }
  
        // Optional: refresh paths from Firestore (even if router state had them)
        if (data?.track?.storagePath) setResolvedTrackPath(data.track.storagePath);
        if (data?.ai_video?.storagePath) setResolvedAIVideoPath(data.ai_video.storagePath);
      });
    });
  
    return () => {
      if (unsubDoc) unsubDoc();
      if (unsubAuth) unsubAuth();
    };
  }, [genId]);
  

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const regenerateTrack = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      setGeneratedTrack({
        title: "Mysterious Journey",
        genre: "Ambient",
        mood: "Mysterious, Contemplative",
        duration: "2:45",
        bpm: 95,
      })
    }, 2000)
  }

  const handleWaveformClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration
    setCurrentTime(newTime)
  }

  const handleWaveformMouseDown = (e) => {
    setIsDragging(true)
    handleWaveformClick(e)
  }

  const handleWaveformMouseMove = (e) => {
    if (isDragging) {
      handleWaveformClick(e)
    }
  }

  const handleWaveformMouseUp = () => {
    setIsDragging(false)
  }

  const handleSaveProjectName = () => {
    setIsEditingName(false)
    // Here you would typically save to database
    console.log("Saving project name:", projectName)
  }

  const handleSaveToLibrary = () => {
    // Auto-save to library and navigate to dashboard
    console.log("Saving project to library:", projectName)
    navigate("/dashboard")
  }

  if (generating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 animate-pulse">
            <Sparkles className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Creating Your Soundtrack</h2>
          <p className="text-gray-300 mb-8">Our AI is composing the perfect music to match your video's vibe...</p>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-bounce" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl animate-ping" />

        {/* Floating music notes animation */}
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="absolute text-purple-400/20 animate-bounce"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
              fontSize: `${12 + Math.random() * 8}px`,
            }}
          >
            ♪
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center px-4 py-2 bg-gray-800/50 border border-purple-500/20 rounded-xl hover:bg-gray-800/70 hover:border-purple-500/40 transition-all hover:scale-105 mr-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Your Soundtrack is
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block animate-pulse">
              Ready!
            </span>
          </h1>
          <p className="text-xl text-gray-300">AI-generated music perfectly matched to your video content</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Video Preview */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Your Video</h2>
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-purple-500/20 overflow-hidden group hover:border-purple-500/40 transition-all">
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Play className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="text-gray-400">{videoFile?.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Music Player */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Generated Soundtrack</h2>

            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                {isEditingName ? (
                  <div className="flex items-center space-x-2 flex-1">
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-800 border border-purple-500/30 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      onKeyPress={(e) => e.key === "Enter" && handleSaveProjectName()}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveProjectName}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h3 className="text-xl font-bold">{projectName}</h3>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="p-1 hover:bg-purple-500/20 rounded transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                <div>
                  <span className="text-gray-300">Genre:</span> {generatedTrack?.genre}
                </div>
                <div>
                  <span className="text-gray-300">Duration:</span> {generatedTrack?.duration}
                </div>
                <div>
                  <span className="text-gray-300">Mood:</span> {generatedTrack?.mood}
                </div>
                <div>
                  <span className="text-gray-300">BPM:</span> {generatedTrack?.bpm}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 transition-all">
              <div
                className="flex items-center justify-center h-32 mb-4 cursor-pointer relative"
                onMouseDown={handleWaveformMouseDown}
                onMouseMove={handleWaveformMouseMove}
                onMouseUp={handleWaveformMouseUp}
                onMouseLeave={handleWaveformMouseUp}
              >
                <div className="flex items-end space-x-1 h-full w-full relative">
                  {Array.from({ length: 50 }, (_, i) => {
                    const isActive = i / 50 <= currentTime / duration
                    return (
                      <div
                        key={i}
                        className={`rounded-full transition-all duration-150 ${
                          isActive ? "bg-gradient-to-t from-purple-500 to-blue-500" : "bg-gray-600 hover:bg-gray-500"
                        }`}
                        style={{
                          width: "3px",
                          height: `${Math.random() * 80 + 20}%`,
                          animationDelay: isPlaying ? `${i * 50}ms` : "0ms",
                        }}
                      />
                    )
                  })}

                  {/* Progress indicator */}
                  <div
                    className="absolute top-0 w-0.5 h-full bg-white/80 pointer-events-none transition-all"
                    style={{ left: `${(currentTime / duration) * 100}%` }}
                  />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4 cursor-pointer" onClick={handleWaveformClick}>
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={regenerateTrack}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all transform hover:scale-105"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>

                <button
                  onClick={togglePlayback}
                  className="p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>

                <button className="p-3 bg-gray-700 hover:bg-gray-600 rounded-xl transition-all transform hover:scale-105">
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button disabled={!resolvedTrackPath} onClick={handleDownloadTrack} className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25">
                <Download className="w-5 h-5 mr-2" />
                Download Track
              </button>

              <button
                disabled={!resolvedAIVideoPath}
                onClick={handleSaveToLibrary}
                className="flex-1 px-6 py-3 border border-purple-500/50 rounded-xl font-semibold hover:bg-purple-500/10 transition-all transform hover:scale-105"
              >
                Save to Library
              </button>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">AI Analysis Results</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 text-center hover:border-purple-500/40 transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Waveform className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-semibold mb-2">Visual Energy</h3>
              <p className="text-gray-400 text-sm">High-energy scenes detected with dynamic movement patterns</p>
            </div>

            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 text-center hover:border-purple-500/40 transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold mb-2">Emotional Tone</h3>
              <p className="text-gray-400 text-sm">Uplifting and adventurous mood with positive sentiment</p>
            </div>

            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 text-center hover:border-purple-500/40 transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/10">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Volume2 className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="font-semibold mb-2">Pacing Match</h3>
              <p className="text-gray-400 text-sm">Music tempo synchronized with video rhythm and cuts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GeneratePage
