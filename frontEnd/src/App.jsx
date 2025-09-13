import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import SignIn from "./pages/SignIn";
import HomePage from "./pages/HomePage";
import React from 'react'

function PrivateRoute({ children }) {
  const [user, setUser] = useState(undefined);
  useEffect(() => onAuthStateChanged(auth, setUser), []);
  if (user === undefined) return null; // or a spinner
  return user ? children : <Navigate to="/SignIn" replace />;
}

const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<SignIn />} />
      <Route path="/HomePage" element={<HomePage />} />
    </Routes>
  </Router>
);

export default App;