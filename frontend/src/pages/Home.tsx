import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Hero, { HERO_PALETTES } from "../components/hero/Hero";
import { Handshake, Leaf, Users } from "lucide-react";
import AudioControls from "../components/shared/AudioControls";

const Home = () => {
  const { isLoggedIn, logout, user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Hero
      palette={{ tint: HERO_PALETTES.green }}
      accent="partnership"
      showFlyingCards
      trustBadge={{
        text: "SDG 17 · Partnership for the Goals",
        icon: (
          <>
            <Handshake className="w-4 h-4 text-emerald-300" aria-hidden />
            <Leaf className="w-4 h-4 text-green-300" aria-hidden />
            <Users className="w-4 h-4 text-teal-200" aria-hidden />
          </>
        ),
      }}
      headline={{
        line1: "Unite planet, people,",
        line2: "and prosperity.",
      }}
      subtitle="Goal 17 is the partnership goal—finance, policy, and knowledge have to move together or the other SDGs stall. This sim stress-tests that idea: every scenario forces trade-offs across biosphere, society, and economy. Cooperation is how you keep all three standing."
      buttons={{
        primary: {
          text: "Begin mission",
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
