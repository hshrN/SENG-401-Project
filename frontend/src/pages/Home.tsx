import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Hero, { HERO_PALETTES } from "../components/hero/Hero";
import { Star, Globe, Target } from "lucide-react";
import AudioControls from "../components/shared/AudioControls";

const Home = () => {
  const { isLoggedIn, logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Hero
      palette={{ tint: HERO_PALETTES.green }}
      trustBadge={{
        text: "SDG 17: Partnership for the Goals",
        icon: (
          <>
            <Star className="w-4 h-4 text-amber-300" />
            <Globe className="w-4 h-4 text-orange-300" />
            <Target className="w-4 h-4 text-yellow-400" />
          </>
        ),
      }}
      headline={{
        line1: "Shape the World.",
        line2: "One Decision at a Time.",
      }}
      subtitle="You will face real global challenges. Every choice affects the balance of our world—biosphere, society, and economy. Play the game and see the impact."
      buttons={{
        primary: {
          text: "Play",
          onClick: () => navigate("/game"),
        },
        secondary: isLoggedIn
          ? {
              text: `Logout (${user?.username})`,
              onClick: logout,
            }
          : {
              text: "Login",
              onClick: () => navigate("/login"),
            },
        tertiary: {
          text: "Leaderboard",
          onClick: () => navigate("/leaderboard"),
        }
        }}
      />
      <AudioControls />
    </>
  );
};

export default Home;
