import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import './header.css';
import logo from '../../images/ansvab_logo.png';

function Header() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogoClick = () => {
    navigate('/'); // Redirect to /home when logo is clicked
  };

  return (
    <div className="header">
      <div className="navbar">
        <img src={logo} alt="Logo" className="logo" onClick={handleLogoClick} />
        <span className="hamburger" onClick={toggleSidebar}>
          &#9776; {/* Hamburger icon */}
        </span>
      </div>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
    </div>
  );
}

export default Header;
