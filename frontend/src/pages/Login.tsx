import React, { useState } from 'react';
import styles from "./Login.module.css"
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setMessage("");

        if(!password) {
          setMessage("Please enter a Password");
          return;
        }
        if(!username) {
          setMessage("Please enter a Username");
          return;
        }

        try {
          await login({ username, password});
          navigate("/");
        } catch (error){
          setMessage((error as Error).message);
        }
    }

    return (
        <div className={styles.container}>
            <form className = {styles.loginForm} onSubmit={handleLogin} >
                <h2>Login</h2>

                <input 
                type="text" 
                placeholder='Username'
                className = {styles.loginFormInputs}
                onChange = {(e) => setUsername(e.target.value)}
                />
                
                <input 
                type="password" 
                placeholder='Password'
                className = {styles.loginFormInputs} 
                onChange = {(e) => setPassword(e.target.value)}
                />

                <button className = {styles.loginButton}>Login</button>
                <div>
                  <span>Don't have an account? </span><Link className = {styles.signupLink}to = "/signup">Sign Up</Link>
                </div>
                {message && <p className={styles.errorMessage}>{message}</p>}
            </form>
              <a className={styles.link} href="/">
                ← Back to Home
              </a>
        </div>
    );
}

export default Login;