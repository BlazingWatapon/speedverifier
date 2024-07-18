import React, { useState } from 'react';
import logoExpanded from './../assets/Images/logo-expanded.png';
import logoCollapsed from './../assets/Images/logo-collapsed.png';
import { MdMarkEmailRead } from "react-icons/md";
import { RiHome2Line } from "react-icons/ri";
import { FaHistory } from "react-icons/fa";
import NavbarItem from './NavbarItem';
import './Navbar.css';
import { Link } from 'react-router-dom';

function Navbar({ userId }) {
    const [isExpanded, setIsExpanded] = useState(false);

    const menu = [
        {
            name: 'Dashboard',
            icon: RiHome2Line,
            path: `/dashboard/${userId}`,
            size: isExpanded ? '32px' : '30px'  
        },
        {
            name: 'Validate',
            icon: MdMarkEmailRead,
            path: `/validate/${userId}`,
            size: isExpanded ? '32px' : '30px'
        },
        {
            name: 'History',
            icon: FaHistory,
            path: `/history/${userId}`,
            size: isExpanded ? '32px' : '30px'
        }
    ];

    return (
        <div className={`navbar ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <img src={isExpanded ? logoExpanded : logoCollapsed} alt="Logo" className="logo"/>
            {menu.map((item, index) => (
                <div className="item-box" key={index}>
                    <Link to={item.path} className="navbar-link">
                        <NavbarItem name={item.name} Icon={item.icon} iconSize={item.size} />
                    </Link>
                </div>
            ))}
            <button onClick={() => setIsExpanded(!isExpanded)} className="toggle-button">{isExpanded ? '<<' : '>>'}</button>
        </div>
    );
}

export default Navbar;
