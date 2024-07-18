import React, { useState } from 'react';
import avatar from './../assets/Images/avatar.png';
import './Header.css';
import { useNavigate } from 'react-router-dom';

function Header({ title }) {
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const navigate = useNavigate();

    const handleAvatarClick = () => {
        setDropdownVisible(!dropdownVisible);
    };

    const handleLogout = () => {
        localStorage.removeItem("userId");
        navigate('/login');
        window.location.reload(); // Optional: reload page to reset state
    };

    return (
        <header className="header">
            <h1>{title}</h1>
            <div className="avatar-container">
                <img src={avatar} alt="User Avatar" className="avatar" onClick={handleAvatarClick} />
                {dropdownVisible && (
                    <div className="dropdown-menu">
                        <div className="dropdown-item" onClick={handleLogout}>Log Out</div>
                    </div>
                )}
            </div>
        </header>
    );
}

export default Header;
