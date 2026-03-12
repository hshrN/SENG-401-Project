import React from "react";
import styles from "./Home.module.css"
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { isLoggedIn, logout } = useAuth();

  return (
    <div>
      <h1>Home Page</h1>
        {isLoggedIn ? (
          <button onClick={logout}>
            Logout
          </button>
        ) : (
          <Link to="/login" >Login</Link>
        )}
        <br></br>
      <Link to = "/game" >Play</Link>
    </div>
  )
    
};

export default Home;