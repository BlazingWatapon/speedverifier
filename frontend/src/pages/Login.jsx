import React, { useState } from "react";
import axios from "axios";
import logo from "./../assets/Images/logo-expanded.png";
import "./Login.css";
import picture from "./../assets/Images/login-image.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from 'react-router-dom';

function Login({ setLoggedIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/api/login", { email, password });
      const { user } = response.data;
      setLoggedIn(true);
      localStorage.setItem("userId", user.id); // Store user ID in localStorage
      navigate(`/dashboard/${user.id}`);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.error) {
        setErrorMessage(error.response.data.error);
      } else {
        setErrorMessage("An error occurred while signing in");
      }
    }
  };

  return (
    <div className="parent-container">
      <div className="login-page-content">
        <div className="login-content">
          <img src={logo} alt="logo" className="logo" />
          <div className="login">Login</div>
          <div className="sign-up">
            <div className="text">Don't have an account?</div>
            <Link to="/register">
              <button className="sign-up-link"> <u>Sign up</u></button>
            </Link>
          </div>
          <form onSubmit={handleSignIn} className="login-action">
            <div className="login-email-text">Email <span className="required">*</span></div>
            <input
              type="email"
              className="login-email-input"
              value={email}
              onChange={handleEmailChange}
              required
            />
            <div className="password-section">
              <div className="password-text">Password <span className="required">*</span></div>
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="show-password-btn"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
                {showPassword ? " HIDE" : " SHOW"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              className="password-input"
              value={password}
              onChange={handlePasswordChange}
              required
            />
            <button type="submit" className="login-button">Sign in</button>
          </form>
          {errorMessage && <div className="error-message">{errorMessage}</div>}
          <Link to="/register">
            <button className="pass-link"> <u></u></button>
          </Link>
        </div>
        <img src={picture} alt="Login Visual" className="picture"/>
      </div>
    </div>
  );
}

export default Login;
