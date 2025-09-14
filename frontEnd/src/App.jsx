"use client"

import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "./lib/firebase"
import LandingPage from "./pages/LandingPage"
import AuthPage from "./pages/AuthPage"
import UploadPage from "./pages/UploadPage"
import GeneratePage from "./pages/GeneratePage"
import DashboardPage from "./pages/DashboardPage"
import LocalPrototypePage from "./pages/LocalPrototypePage.jsx";

function PrivateRoute({ children }) {
  const [user, setUser] = useState(undefined)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser)
    return () => unsub()
  }, [])
  if (user === undefined) return null // or a spinner
  return user ? children : <Navigate to="/auth" replace />
}

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/upload"
        element={
          <PrivateRoute>
            <UploadPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/generate"
        element={
          <PrivateRoute>
            <GeneratePage />
          </PrivateRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      <Route path="/local" element={<LocalPrototypePage />} />
    </Routes>
  </Router>
)

export default App
