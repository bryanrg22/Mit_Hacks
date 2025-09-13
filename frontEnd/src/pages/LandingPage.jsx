"use client"

import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { Play, Upload, Wand2, Music, Video, Sparkles, ArrowRight, Github, Twitter, Zap, Star } from "lucide-react"

const LandingPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [particles, setParticles] = useState([])
  const [floatingElements, setFloatingElements] = useState([])
  const [flyingStars, setFlyingStars] = useState([])
  const canvasRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  useEffect(() => {
    const initParticles = () => {
      const newParticles = []
      for (let i = 0; i < 50; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.5,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.2,
        })
      }
      setParticles(newParticles)
    }

    const initFloatingElements = () => {
      const elements = []
      for (let i = 0; i < 8; i++) {
        elements.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          rotation: Math.random() * 360,
          scale: Math.random() * 0.5 + 0.5,
          speed: Math.random() * 2 + 1,
        })
      }
      setFloatingElements(elements)
    }

    const initFlyingStars = () => {
      const stars = []
      for (let i = 0; i < 15; i++) {
        stars.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 4 + 2,
          speedX: (Math.random() - 0.5) * 4,
          speedY: (Math.random() - 0.5) * 4,
          opacity: Math.random() * 0.8 + 0.2,
          trail: [],
        })
      }
      setFlyingStars(stars)
    }

    initParticles()
    initFloatingElements()
    initFlyingStars()
  }, [])

  useEffect(() => {
    const animateParticles = () => {
      setParticles((prev) =>
        prev.map((particle) => ({
          ...particle,
          x: particle.x + particle.speedX,
          y: particle.y + particle.speedY,
          x: particle.x > window.innerWidth ? 0 : particle.x < 0 ? window.innerWidth : particle.x,
          y: particle.y > window.innerHeight ? 0 : particle.y < 0 ? window.innerHeight : particle.y,
        })),
      )

      setFlyingStars((prev) =>
        prev.map((star) => {
          const newX = star.x + star.speedX
          const newY = star.y + star.speedY
          const newTrail = [...star.trail, { x: star.x, y: star.y }].slice(-8)

          return {
            ...star,
            x: newX > window.innerWidth ? -10 : newX < -10 ? window.innerWidth : newX,
            y: newY > window.innerHeight ? -10 : newY < -10 ? window.innerHeight : newY,
            trail: newTrail,
          }
        }),
      )
    }

    const interval = setInterval(animateParticles, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"
          style={{
            left: mousePosition.x * 0.02 + "px",
            top: mousePosition.y * 0.02 + "px",
            transform: `translate(-50%, -50%)`,
          }}
        />
        <div
          className="absolute w-64 h-64 bg-blue-500/25 rounded-full blur-3xl animate-bounce"
          style={{
            right: mousePosition.x * 0.01 + "px",
            top: mousePosition.y * 0.015 + "px",
          }}
        />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />

        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: particle.x + "px",
              top: particle.y + "px",
              opacity: particle.opacity,
              transform: `scale(${particle.size})`,
            }}
          />
        ))}

        {flyingStars.map((star) => (
          <div key={`star-${star.id}`}>
            {star.trail.map((trailPoint, index) => (
              <div
                key={`trail-${star.id}-${index}`}
                className="absolute bg-gradient-to-r from-yellow-400 to-purple-400 rounded-full"
                style={{
                  left: trailPoint.x + "px",
                  top: trailPoint.y + "px",
                  width: `${star.size * (index / star.trail.length)}px`,
                  height: `${star.size * (index / star.trail.length)}px`,
                  opacity: star.opacity * (index / star.trail.length) * 0.6,
                  boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 0, ${star.opacity * 0.5})`,
                }}
              />
            ))}
            <div
              className="absolute bg-gradient-to-r from-yellow-300 to-white rounded-full animate-pulse"
              style={{
                left: star.x + "px",
                top: star.y + "px",
                width: `${star.size}px`,
                height: `${star.size}px`,
                opacity: star.opacity,
                boxShadow: `0 0 ${star.size * 3}px rgba(255, 255, 255, ${star.opacity})`,
              }}
            />
          </div>
        ))}

        {floatingElements.map((element) => (
          <div
            key={element.id}
            className="absolute w-8 h-8 border border-purple-400/30 animate-spin"
            style={{
              left: element.x + "%",
              top: element.y + "%",
              transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
              animationDuration: `${element.speed * 3}s`,
            }}
          />
        ))}

        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, rgba(168, 85, 247, 0.15) 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>
      </div>

      <nav className="relative z-10 flex items-center justify-between p-6 lg:px-12 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center animate-pulse">
            <Music className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            SoundSync
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="hover:text-purple-300 transition-all duration-300 hover:scale-105">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-purple-300 transition-all duration-300 hover:scale-105">
            How It Works
          </a>
          <a href="#pricing" className="hover:text-purple-300 transition-all duration-300 hover:scale-105">
            Pricing
          </a>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/auth"
            className="px-4 py-2 text-sm border border-purple-500/50 rounded-lg hover:bg-purple-500/20 hover:border-purple-400 transition-all duration-300 hover:scale-105"
          >
            Sign In
          </Link>
          <Link
            to="/auth"
            className="px-4 py-2 text-sm bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-32">
        <div className="text-center">
          <div className="inline-flex items-center px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-full text-sm mb-8 animate-pulse hover:bg-purple-500/30 transition-all duration-300 cursor-pointer">
            <Sparkles className="w-4 h-4 mr-2 animate-spin" />
            AI-Powered Video Analysis
            <Zap className="w-4 h-4 ml-2 text-yellow-400" />
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold mb-8 leading-tight">
            <span className="inline-block animate-fade-in-up">From Video to</span>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent block animate-fade-in-up animation-delay-200">
              Perfect Soundtrack
            </span>
          </h1>

          <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up animation-delay-400">
            Upload your video, let AI analyze every frame, and get a custom soundtrack that perfectly matches your
            content's vibe in <span className="text-purple-400 font-semibold">seconds</span>.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in-up animation-delay-600">
            <Link
              to="/upload"
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 flex items-center"
            >
              <Upload className="w-5 h-5 mr-2 group-hover:animate-bounce" />
              Upload Video
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>

            <button className="group px-8 py-4 border border-purple-500/50 rounded-xl font-semibold text-lg hover:bg-purple-500/20 hover:border-purple-400 transition-all duration-300 transform hover:scale-105 flex items-center">
              <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Watch Demo
            </button>
          </div>

          <div className="relative max-w-4xl mx-auto animate-fade-in-up animation-delay-800">
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-purple-500/20 overflow-hidden relative group hover:border-purple-500/40 transition-all duration-300">
              <div className="w-full h-full flex items-center justify-center relative">
                <div className="text-center">
                  <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500/30 transition-all duration-300 hover:scale-110 cursor-pointer">
                    <Play className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <p className="text-gray-400">Interactive Demo Coming Soon</p>
                </div>

                <div className="absolute top-4 left-4 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-xs text-green-400 animate-pulse">
                  <Star className="w-3 h-3 inline mr-1" />
                  AI Analyzing...
                </div>
                <div className="absolute bottom-4 right-4 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-xs text-blue-400 animate-bounce">
                  <Music className="w-3 h-3 inline mr-1" />
                  Generating Music
                </div>
              </div>
            </div>
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-3xl blur-xl -z-10 group-hover:from-purple-500/30 group-hover:to-blue-500/30 transition-all duration-300" />
          </div>
        </div>
      </div>

      <div id="features" className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Why Content Creators
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block">
              Choose SoundSync
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Stop spending hours searching for the perfect soundtrack. Let AI do the work.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="group p-8 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl hover:border-purple-500/40 hover:bg-purple-900/30 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-300 transition-colors">
              Smart Video Analysis
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Our AI analyzes visual elements, motion, colors, and mood from every frame to understand your content's
              essence.
            </p>
          </div>

          <div className="group p-8 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl hover:border-purple-500/40 hover:bg-purple-900/30 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Wand2 className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-300 transition-colors">
              AI Music Generation
            </h3>
            <p className="text-gray-300 leading-relaxed">
              Powered by advanced AI models, we create original soundtracks that perfectly match your video's vibe and
              pacing.
            </p>
          </div>

          <div className="group p-8 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/20 rounded-2xl hover:border-purple-500/40 hover:bg-purple-900/30 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-4 group-hover:text-purple-300 transition-colors">Instant Results</h3>
            <p className="text-gray-300 leading-relaxed">
              Get your custom soundtrack in seconds, not hours. Perfect for tight deadlines and creative workflows.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 py-20 text-center">
        <div className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/20 rounded-3xl p-12 hover:border-purple-500/40 hover:bg-purple-900/50 transition-all duration-300 group">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block">
              Your Content?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of creators who've revolutionized their workflow with AI-powered soundtracks.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 group-hover:animate-pulse"
          >
            Start Creating Now
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" />
          </Link>
        </div>
      </div>

      <footer className="relative z-10 border-t border-purple-500/20 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Music className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                SoundSync
              </span>
            </div>

            <div className="flex items-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-purple-500/10 text-center text-gray-400">
            <p>&copy; 2025 SoundSync. Built for HackMIT 2025.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
