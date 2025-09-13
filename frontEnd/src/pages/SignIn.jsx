import React, { useEffect, useState } from 'react'
import { Eye, EyeOff, User, Lock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { auth, googleProvider } from '../lib/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'

export default function SignIn() {
  const [isNewUser, setIsNewUser] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const mapAuthError = (e) => {
    switch (e.code) {
      case 'auth/invalid-email': return 'Invalid email address.'
      case 'auth/user-not-found': return 'No account found with this email.'
      case 'auth/wrong-password': return 'Incorrect password.'
      case 'auth/email-already-in-use': return 'Email already in use.'
      case 'auth/weak-password': return 'Password should be at least 6 characters.'
      case 'auth/popup-closed-by-user': return 'Popup closed before completing sign in.'
      default: return 'Something went wrong. Please try again.'
    }
  }

  useEffect(() => {
    // If already signed in, go to Home
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate('/HomePage')
    })
    return () => unsub()
  }, [navigate])

  const handleEmailPassword = async () => {
    setLoading(true); setError('')
    try {
      if (isNewUser) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.')
          return
        }
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        // Optional: set a default displayName
        if (cred.user && !cred.user.displayName) {
          await updateProfile(cred.user, { displayName: email.split('@')[0] })
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      navigate('/HomePage')
    } catch (e) {
      setError(mapAuthError(e))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setLoading(true); setError('')
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/HomePage')
    } catch (e) {
      setError(mapAuthError(e))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleEmailPassword()
  }

  const toggleNewUser = () => {
    setIsNewUser(!isNewUser)
    setEmail(''); setPassword(''); setConfirmPassword('')
    setShowPassword(false); setShowConfirmPassword(false); setError('')
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <main className="flex-grow flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center text-white mb-12">
          <img src="/logo.png" alt="Market Sense Logo" className="w-28 h-28 mx-auto mb-4" style={{aspectRatio:"1/1",objectFit:"contain"}} />
          <h1 className="text-3xl font-bold">eduTrade</h1>
          <p className="text-xl text-gray-300 mt-2">By Beginners. For Beginners</p>
        </div>

        <div className="w-full max-w-sm bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="px-8 py-10">
            <h2 className="text-2xl font-extrabold text-white mb-6 text-center">
              {isNewUser ? "Create Account" : "Welcome Back"}
            </h2>
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <label htmlFor="email" className="sr-only">Email</label>
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <label htmlFor="password" className="sr-only">Password</label>
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="block w-full pl-10 pr-10 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {isNewUser && (
                <div className="relative">
                  <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    className="block w-full pl-10 pr-10 py-2 border border-gray-600 rounded-md leading-5 bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                disabled={loading}
              >
                {loading ? 'Processing...' : (isNewUser ? "Create Account" : "Sign In")}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-gray-800 px-2 text-gray-400">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                className="w-full flex justify-center py-3 px-4 rounded-md text-sm font-medium bg-white text-gray-900 hover:bg-gray-100 transition"
                disabled={loading}
              >
                Continue with Google
              </button>
            </form>

            <div className="mt-6 text-center">
              <button onClick={toggleNewUser} className="text-sm text-blue-400 hover:text-blue-300">
                {isNewUser ? "Already a user?" : "New user?"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-gray-400">
        <p>&copy; 2024 eduTrade. All rights reserved.</p>
      </footer>
    </div>
  )
}
