import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AudioProvider } from "./context/AudioContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Game from "./pages/Game";
import Leaderboard from "./pages/Leaderboard";
import SignUp from "./pages/SignUp";

function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/game"
              element={
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              }
            />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </HashRouter>
      </AudioProvider>
    </AuthProvider>
  );
}

export default App;
