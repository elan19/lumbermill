import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom'; // Import NavLink
import './sidebar.css'; // Make sure this CSS file exists and is styled

// Helper function to apply active class - adjust if needed
const getNavLinkClass = ({ isActive }) => {
  return isActive ? 'sidebar-link active' : 'sidebar-link';
};

function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();

  // Check if user is logged in by checking token in localStorage
  // Note: This is a basic check. Consider context or other state management for robustness.
  const isLoggedIn = !!localStorage.getItem('token'); // Use !! to force boolean

  // Logout function
  const handleLogout = () => {
    localStorage.removeItem('token'); // Remove token from storage
    toggleSidebar(); // Close sidebar after action
    navigate('/login'); // Redirect to login page
  };

  // Function to handle link clicks (closes sidebar)
  const handleLinkClick = () => {
    if (isOpen) {
      toggleSidebar();
    }
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <button className="close-btn" onClick={toggleSidebar}>×</button>
      <h2>Navigering</h2>

      <ul>
        {/* --- Links visible regardless of login status --- */}
        <li>
          <NavLink to="/" onClick={handleLinkClick} className={getNavLinkClass}>
            Hem
          </NavLink>
        </li>
        <li>
          <NavLink to="/products" onClick={handleLinkClick} className={getNavLinkClass}>
            Produkter
          </NavLink>
        </li>
        <li>
          <NavLink to="/about" onClick={handleLinkClick} className={getNavLinkClass}>
            Om oss
          </NavLink>
        </li>
        <li> {/* <-- New Information Link --> */}
          <NavLink to="/information" onClick={handleLinkClick} className={getNavLinkClass}>
            Produktion
          </NavLink>
        </li>
        <li>
          <NavLink to="/contact" onClick={handleLinkClick} className={getNavLinkClass}>
            Kontakta oss
          </NavLink>
        </li>
        <li>
          <NavLink to="/policy" onClick={handleLinkClick} className={getNavLinkClass}>
            Våra policier
          </NavLink>
        </li>


        {/* --- Links specific to logged-in users (Dashboard/Platform) --- */}
        {isLoggedIn && (
          <>
            <li className="sidebar-divider"><hr/></li>
            <li>
              <NavLink to="/dashboard" onClick={handleLinkClick} className={getNavLinkClass}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard/orders" onClick={handleLinkClick} className={getNavLinkClass}>
                Ordrar
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard/prilista" onClick={handleLinkClick} className={getNavLinkClass}>
                Prilista
              </NavLink>
            </li>
             <li>
               <NavLink to="/dashboard/lagerplats" onClick={handleLinkClick} className={getNavLinkClass}>
                 Lagerplats
               </NavLink>
             </li>
             <li>
               <NavLink to="/dashboard/kantlista" onClick={handleLinkClick} className={getNavLinkClass}>
                 Kantlista
               </NavLink>
             </li>
             <li>
               <NavLink to="/dashboard/klupplista" onClick={handleLinkClick} className={getNavLinkClass}>
                 Klupplista
               </NavLink>
             </li>
             <li>
              <NavLink to="/dashboard/settings" onClick={handleLinkClick} className={getNavLinkClass}>
                Settings
              </NavLink>
            </li>
             <li className="sidebar-divider"><hr/></li>
             <li>
               <button onClick={handleLogout} className="sidebar-link logout-button">
                 Logga ut
               </button>
             </li>
          </>
        )}

        {/* --- Login Link (Only visible when logged out) --- */}
        {!isLoggedIn && (
           <>
             <li className="sidebar-divider"><hr/></li>
             <li>
               <NavLink to="/login" onClick={handleLinkClick} className={getNavLinkClass}>
                 Plattform 
               </NavLink>
            </li>
           </>
        )}
      </ul>
    </div>
  );
}

export default Sidebar;