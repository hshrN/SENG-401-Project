import React, { useState } from 'react';
import styles from "./SignUp.module.css"
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from "../context/AuthContext";

const SignUp = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState("");
    const navigate = useNavigate();
    const { signup } = useAuth();

    const handleSignup = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setMessage("");

        if(!confirmPassword) {
            setMessage("Please confirm your password");
            return;
        }
        if(!password) {
            setMessage("Please enter a Password");
            return;
        }
        if(!username) {
            setMessage("Please enter a Username");
            return;
        }

        try {
          await signup({ username, password, confirmPassword });
          navigate("/");
        } catch (error){
          setMessage((error as Error).message);
        }
    }

    return (
        <div className={styles.container}>
            <form className = {styles.signupForm} onSubmit={handleSignup} >
                <h2>Sign Up</h2>

                <input 
                type="text" 
                placeholder='Username'
                className = {styles.signupFormInputs}
                onChange = {(e) => setUsername(e.target.value)}
                />
                
                <input 
                type="password" 
                placeholder='Password'
                className = {styles.signupFormInputs} 
                onChange = {(e) => setPassword(e.target.value)}
                />

                <input 
                type="password" 
                placeholder='Confirm-Password'
                className = {styles.signupFormInputs}
                onChange = {(e) => setConfirmPassword(e.target.value)} 
                />

                <button id = 'signup-button' className = {styles.signupButton}>Sign Up</button>
                <div>
                  <span>Already have an account? </span><Link className = {styles.loginLink}to = "/login">Login</Link>
                </div>
                {message && <p className={styles.errorMessage}>{message}</p>}
            </form>
        </div>
    );
}

export default SignUp;