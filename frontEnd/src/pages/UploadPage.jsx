"use client"

import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { Upload, Video, Music, ArrowRight, X, CheckCircle, ArrowLeft } from "lucide-react"

const UploadPage = () => {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file) => {
    const supportedTypes = [
      "video/mp4",
      "video/mov",
      "video/avi",
      "video/quicktime",
      "video/x-msvideo",
      "audio/mp3",
      "audio/wav",
      "audio/mpeg",
      "audio/ogg",
      "audio/aac",
    ]

    if (supportedTypes.some((type) => file.type.includes(type.split("/")[1]))) {
      setUploadedFile(file)
    } else {
      alert("Please upload a video file (MP4, MOV, AVI) or audio file (MP3, WAV, AAC)")
    }
  }

  const startAnalysis = () => {
    setAnalyzing(true)
    setProgress(0)

    // Simulate analysis progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => {
            navigate("/generate", { state: { videoFile: uploadedFile } })
          }, 1000)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-bounce" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-purple-500/20 rounded-xl hover:bg-gray-800/70 hover:border-purple-500/40 transition-all hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            Step 1 of 3: Upload Content
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6">
            Upload Your
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block">
              Media Content
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Drop your video or audio file and let our AI analyze it to create the perfect soundtrack
          </p>
        </div>

        {!uploadedFile ? (
          /* Upload Area */
          <div
            className={`relative border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
              dragActive
                ? "border-purple-400 bg-purple-500/10"
                : "border-gray-600 hover:border-purple-500/50 hover:bg-purple-500/5"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input ref={fileInputRef} type="file" accept="video/*,audio/*" onChange={handleChange} className="hidden" />

            <div className="space-y-6">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                <Upload className="w-10 h-10" />
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-2">Drop your media here</h3>
                <p className="text-gray-400 mb-6">Supports MP4, MOV, AVI videos and MP3, WAV, AAC audio files</p>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                >
                  Choose File
                </button>
              </div>

              <div className="text-sm text-gray-500">Maximum file size: 500MB</div>
            </div>
          </div>
        ) : (
          /* File Preview & Analysis */
          <div className="space-y-8">
            {/* File Info */}
            <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                    {uploadedFile.type.startsWith("video/") ? (
                      <Video className="w-6 h-6" />
                    ) : (
                      <Music className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{uploadedFile.name}</h3>
                    <p className="text-gray-400">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate("/dashboard")}
                    className="px-4 py-2 text-sm border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setUploadedFile(null)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Analysis Progress */}
            {analyzing && (
              <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Music className="w-8 h-8 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Analyzing Your Media</h3>
                  <p className="text-gray-400">Our AI is examining visual elements, motion, and mood...</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                <div className="text-center text-sm text-gray-400">
                  {progress < 30 && "Analyzing visual elements..."}
                  {progress >= 30 && progress < 60 && "Detecting motion patterns..."}
                  {progress >= 60 && progress < 90 && "Understanding mood and tone..."}
                  {progress >= 90 && progress < 100 && "Preparing music generation..."}
                  {progress >= 100 && (
                    <div className="flex items-center justify-center text-green-400">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Analysis complete! Redirecting...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Start Analysis Button */}
            {!analyzing && (
              <div className="text-center">
                <button
                  onClick={startAnalysis}
                  className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 flex items-center mx-auto"
                >
                  Start Analysis
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-gray-400 mt-4">This usually takes 10-30 seconds depending on media length</p>
              </div>
            )}
          </div>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 mt-16">
          <div className="text-center p-6">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Video className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="font-semibold mb-2">Frame Analysis</h3>
            <p className="text-gray-400 text-sm">AI examines every frame for visual cues and emotional context</p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Music className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="font-semibold mb-2">Mood Detection</h3>
            <p className="text-gray-400 text-sm">Advanced algorithms identify the emotional tone and energy level</p>
          </div>

          <div className="text-center p-6">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-6 h-6 text-indigo-400" />
            </div>
            <h3 className="font-semibold mb-2">Instant Generation</h3>
            <p className="text-gray-400 text-sm">Get your custom soundtrack in seconds, not hours</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPage
