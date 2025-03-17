import React from 'react';
import { useNavigate } from 'react-router-dom';
import './sidebar.css';

function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();

  // Check if user is logged in by checking token in localStorage
  const isLoggedIn = localStorage.getItem('token');

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token from storage
    navigate('/login'); // Redirect to login page
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button className="close-btn" onClick={toggleSidebar}>×</button>
      <h2>Länkar</h2>
      <ul>
        <li><a href="/Dashboard">Hem</a></li>
        {isLoggedIn ? (
          <li><a onClick={handleLogout} href="/login">Logout</a></li>
        ) : (
          <li><a href="/login">Login</a></li>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;
