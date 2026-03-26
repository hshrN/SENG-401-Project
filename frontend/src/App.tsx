import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AudioProvider, useAudio } from "./context/AudioContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Game from "./pages/Game";
import Leaderboard from "./pages/Leaderboard";
import SignUp from "./pages/SignUp";

function GlobalMusicManager() {
  const { startEndBgm } = useAudio();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== '/game') {
      startEndBgm();
    }
  }, [location.pathname, startEndBgm]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <AudioProvider>
        <BrowserRouter>
          <GlobalMusicManager />
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
        </BrowserRouter>
      </AudioProvider>
    </AuthProvider>
  );
}

export default App;
