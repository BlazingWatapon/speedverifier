import React, { useState } from "react";
import "./Register.css";
import logo from "./../assets/Images/logo-expanded.png";
import picture from "./../assets/Images/login-image.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate for redirection

function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.status !== 200) {
        setError(result.error);
      } else {
        alert("Registration successful!");
        navigate("/login");
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <div className="parent-container">
      <div className="register-page-content">
        <div className="register-content">
          <img src={logo} alt="logo" className="logo" />
          <div className="register">Sign Up</div>
          <form className="register-action" onSubmit={handleSubmit}>
            <div className="register-name">
              <div className="register-field">
                <div className="register-text">First name <span className="required">*</span></div>
                <input
                  type="text"
                  name="firstName"
                  className="register-input"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="register-field">
                <div className="register-text">Last name <span className="required">*</span></div>
                <input
                  type="text"
                  name="lastName"
                  className="register-input"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="register-mail-phone">
              <div className="register-field">
                <div className="register-text">
                  Email <span className="required">*</span>
                </div>
                <input
                  type="email"
                  name="email"
                  className="register-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="register-field">
                <div className="register-text">Mobile phone <span className="required">*</span></div>
                <input
                  type="tel"
                  name="phoneNumber"
                  className="register-input"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>
            <div className="register-password-section">
              <div className="register-field">
                <div className="register-text">
                  Password <span className="required">*</span>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="register-input"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="register-field">
                <div className="register-text">
                  Confirm Password <span className="required">*</span>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  className="register-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="show-password-btn"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
              {showPassword ? " HIDE" : " SHOW"}
            </button>
            {error && <div className="error-message-register">{error}</div>}
            <div className="log-in">
              <button type="submit" className="signup-button">
                Sign up
              </button>
              <div className="login-text">Already have an account?</div>
              <Link to="/login">
                <button className="login-link">
                  <u>Log in</u>
                </button>
              </Link>
            </div>
          </form>
        </div>
        <img src={picture} alt="Login Visual" className="picture" />
      </div>
    </div>
  );
}

export default Register;
