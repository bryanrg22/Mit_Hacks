"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  Play,
  Download,
  Trash2,
  Plus,
  Music,
  Video,
  Clock,
  TrendingUp,
  LogOut,
  User,
  Settings,
  Sparkles,
} from "lucide-react"
import { signOut } from "firebase/auth"
import { auth, db, storage } from "../lib/firebase"
import { ref, getDownloadURL } from "firebase/storage"
import { onAuthStateChanged } from "firebase/auth"
import { collection, query, orderBy, getDocs } from "firebase/firestore"

const DashboardPage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedGenre, setSelectedGenre] = useState("all")
  const [filteredProjects, setFilteredProjects] = useState([])

  const [projects, setProjects] = useState([])

  const [hoveredCard, setHoveredCard] = useState(null)
  const [pulsingStats, setPulsingStats] = useState([])

  const navigate = useNavigate()

  useEffect(() => {
    const off = onAuthStateChanged(auth, async (user) => {
    if (!user) { navigate("/auth"); return }
    const gensRef = collection(db, "users", user.uid, "generations")
    const q = query(gensRef, orderBy("updatedAt", "desc"))
    const snap = await getDocs(q)
    const items = snap.docs.map((d) => {
      const data = d.data() || {}
      const title = data.title || "Untitled"
      const normPath = data.normal_video?.storagePath || ""
      const trackPath = data.track?.storagePath || ""
      const videoName = normPath ? normPath.split("/").pop() : title
      const trackName = trackPath ? trackPath.split("/").pop() : "track.mp3"
      return {
        id: d.id,
        title,
        videoName,
        trackName,
        genre: data.track?.genre || "—",
        duration: data.track?.duration || "—",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : "",
        thumbnail: data.thumbnailUrl || "/placeholder.svg",
        _raw: data,
      }
    })
    setProjects(items)
  })
  return () => off()
  }, [navigate])
  

  useEffect(() => {
    let filtered = projects.filter(
      (project) =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.trackName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.genre.toLowerCase().includes(searchQuery.toLowerCase()),
    )

    if (selectedGenre !== "all") {
      filtered = filtered.filter((project) => project.genre.toLowerCase() === selectedGenre.toLowerCase())
    }

    setFilteredProjects(filtered)
  }, [searchQuery, selectedGenre, projects])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      navigate("/")
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handleCardDownload = async (project) => {
    // Prefer the audio track; fall back to the AI muxed video if needed
    const path =
      project._raw?.track?.storagePath ||
      project._raw?.ai_video?.storagePath
  
    if (!path) { alert("No downloadable file on this project yet."); return }
  
    try {
      const url = await getDownloadURL(ref(storage, path))
      const a = document.createElement("a")
      a.href = url
      a.download = path.split("/").pop() || "download"
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e) {
      console.error(e)
      alert("File isn’t ready yet. Try again shortly.")
    }
  }
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-bounce" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl animate-ping" />

        {/* Enhanced floating particles */}
        {Array.from({ length: 20 }, (_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-purple-400/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Floating geometric shapes */}
        <div
          className="absolute top-20 right-20 w-12 h-12 border-2 border-purple-400/30 rotate-45 animate-spin"
          style={{ animationDuration: "8s" }}
        />
        <div className="absolute bottom-32 left-16 w-8 h-8 border-2 border-blue-400/30 animate-bounce" />
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-purple-400/20 rounded-full animate-pulse" />
        <div className="absolute top-1/2 left-1/4 w-10 h-10 border border-indigo-400/20 rounded-full animate-ping" />
        <div className="absolute bottom-1/3 right-1/2 w-4 h-4 bg-blue-400/30 rotate-45 animate-bounce" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Your Creative
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent block animate-pulse">
                Dashboard
              </span>
            </h1>
            <p className="text-xl text-gray-300">Manage your AI-generated soundtracks and video projects</p>
          </div>

          <div className="mt-6 lg:mt-0 flex items-center space-x-4">
            <Link
              to="/upload"
              className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
            >
              <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              New Project
            </Link>

            {/* User menu dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 border border-purple-500/20 rounded-xl hover:bg-gray-800/70 hover:border-purple-500/40 transition-all hover:scale-105">
                <User className="w-5 h-5" />
                <span className="hidden sm:block">Account</span>
              </button>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-xl border border-purple-500/20 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2">
                  <button className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-purple-500/20 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-left hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search projects, tracks, or genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-gray-900/50 border border-purple-500/20 rounded-xl text-white placeholder-gray-400 focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>

            {/* Genre Filter */}
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="px-4 py-3 bg-gray-900/50 border border-purple-500/20 rounded-xl text-white focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
            >
              <option value="all">All Genres</option>
              <option value="cinematic">Cinematic</option>
              <option value="electronic">Electronic</option>
              <option value="ambient">Ambient</option>
              <option value="classical">Classical</option>
            </select>
          </div>
        </div>

        {/* Stats Grid with enhanced animations */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {[
            { icon: Video, value: "24", label: "Videos Processed", color: "purple" },
            { icon: Music, value: "18", label: "Tracks Generated", color: "blue" },
            { icon: Clock, value: "2.4h", label: "Time Saved", color: "indigo" },
            { icon: Download, value: "12", label: "Downloads", color: "green" },
          ].map((stat, index) => (
            <div
              key={index}
              className={`group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 hover:border-purple-500/40 hover:bg-gray-800/90 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10 ${
                pulsingStats.includes(index) ? "animate-pulse border-purple-400/60" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 bg-${stat.color}-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}
                >
                  <stat.icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <TrendingUp className="w-5 h-5 text-green-400 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold mb-1 group-hover:text-purple-300 transition-colors">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Projects Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-8 flex items-center">
            Recent Projects
            <Sparkles className="w-6 h-6 ml-2 text-purple-400 animate-pulse" />
            <span className="ml-4 text-sm text-gray-400 font-normal">
              ({filteredProjects.length} {filteredProjects.length === 1 ? "project" : "projects"})
            </span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="group bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-xl border border-purple-500/20 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/10"
                onMouseEnter={() => setHoveredCard(project.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => navigate("/generate", { state: { generationDoc: project._raw, genId: project.id } })}
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                  <img
                    src={project.thumbnail || "/placeholder.svg"}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-300 flex items-center justify-center ${
                      hoveredCard === project.id ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <button className="p-3 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-all duration-300 transform hover:scale-110">
                      <Play className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="absolute top-3 left-3 px-2 py-1 bg-purple-500/80 backdrop-blur-sm text-purple-100 rounded-lg text-xs font-medium animate-pulse">
                    {project.genre}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-purple-300 transition-colors">
                    {project.title}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-400 mb-4">
                    <div className="flex items-center">
                      <Video className="w-4 h-4 mr-2" />
                      {project.videoName}
                    </div>
                    <div className="flex items-center">
                      <Music className="w-4 h-4 mr-2" />
                      {project.trackName}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{project.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{project.createdAt}</span>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-purple-500/20 hover:text-purple-300 rounded-lg transition-all duration-300 transform hover:scale-110">
                        <Play className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleCardDownload(project) }} className="p-2 hover:bg-blue-500/20 hover:text-blue-300 rounded-lg transition-all duration-300 transform hover:scale-110">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-all duration-300 transform hover:scale-110">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProjects.length === 0 && projects.length > 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">No projects found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>

        {/* Empty State for New Users */}
        {projects.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
              <Music className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold mb-4">No Projects Yet</h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Upload your first video to start creating amazing AI-generated soundtracks
            </p>
            <Link
              to="/upload"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Project
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
