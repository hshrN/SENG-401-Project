import React, { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  House,
  Info,
  LogIn,
  LogOut,
  Menu,
  Play,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import { RadialActionMenu, type RadialMenuItem } from "../radialMenu/RadialActionMenu";
import AudioControls from "./AudioControls";
import { useAuth } from "../../context/AuthContext";
import { useAudio } from "../../context/AudioContext";

type GlobalNavProps = {
  backTo?: string;
  backClassName?: string;
  menuItems?: RadialMenuItem[];
  menuSize?: number;
};

export default function GlobalNav({
  backTo = "/",
  backClassName: _backClassName,
  menuItems,
  menuSize = 250,
}: GlobalNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();
  const { isMuted, toggleMute, playSound } = useAudio();

  const sharedItems = useMemo<RadialMenuItem[]>(() => {
    const items: RadialMenuItem[] = [];

    if (location.pathname !== backTo) {
      items.push({
        id: "nav-home",
        label: "Go home",
        icon: <House size={18} />,
        onSelect: () => {
          playSound("button_click");
          navigate(backTo);
        },
      });
    }

    const authScreen =
      location.pathname === "/login" || location.pathname === "/signup";

    if (location.pathname !== "/game" && (isLoggedIn || !authScreen)) {
      items.push({
        id: "nav-play",
        label: isLoggedIn ? "Begin mission" : "Login to play",
        icon: <Play size={18} />,
        onSelect: () => {
          playSound("button_click");
          navigate(isLoggedIn ? "/game" : "/login");
        },
      });
    }

    if (location.pathname !== "/leaderboard") {
      items.push({
        id: "nav-leaderboard",
        label: "Leaderboard",
        icon: <Trophy size={18} />,
        onSelect: () => {
          playSound("button_click");
          navigate("/leaderboard");
        },
      });
    }

    if (location.pathname !== "/about") {
      items.push({
        id: "nav-about",
        label: "About",
        icon: <Info size={18} />,
        onSelect: () => {
          playSound("button_click");
          navigate("/about");
        },
      });
    }

    items.push({
      id: "nav-audio",
      label: isMuted ? "Unmute audio" : "Mute audio",
      icon: isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />,
      onSelect: () => {
        const wasMuted = isMuted;
        toggleMute();
        if (wasMuted) {
          setTimeout(() => playSound("button_click"), 50);
        } else {
          playSound("button_click");
        }
      },
    });

    if (isLoggedIn) {
      items.push({
        id: "nav-logout",
        label: "Logout",
        icon: <LogOut size={18} />,
        onSelect: () => {
          playSound("button_click");
          logout();
          navigate("/");
        },
      });
    } else if (!authScreen) {
      items.push({
        id: "nav-login",
        label: "Login",
        icon: <LogIn size={18} />,
        onSelect: () => {
          playSound("button_click");
          navigate("/login");
        },
      });
    }

    return items;
  }, [
    backTo,
    isLoggedIn,
    isMuted,
    location.pathname,
    logout,
    navigate,
    playSound,
    toggleMute,
  ]);

  const mergedItems = useMemo(() => {
    const seen = new Set<string>();
    const combined = [...(menuItems ?? []), ...sharedItems];
    return combined.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [menuItems, sharedItems]);

  return (
    <>
      <RadialActionMenu
        size={Math.max(menuSize, mergedItems.length > 5 ? 280 : menuSize)}
        triggerIcon={<Menu size={18} />}
        triggerAriaLabel="Open global controls menu"
        items={mergedItems}
      />
      <AudioControls placement="nav" />
    </>
  );
}

