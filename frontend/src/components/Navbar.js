import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';

function Navbar() {
  const { user } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const [language, setLanguage] = useState('RU');
  const navigate = useNavigate();

  const handleProfileClick = () => {
    navigate('/profile');
  };

  const handleLogoClick = () => {
    navigate('/courses');
  };

  return (
    <nav className="navbar-top">
      <div className="navbar-left">
        <button className="menu-toggle" onClick={toggleSidebar}>
          <span className="hamburger"></span>
          <span className="hamburger"></span>
          <span className="hamburger"></span>
        </button>
        <h1 className="navbar-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>Memorix</h1>
      </div>
      
      <div className="navbar-right">
        <div className="navbar-notifications">
          <span className="notification-icon">🔔</span>
          <span className="notification-badge">3</span>
        </div>
        
        <div className="navbar-language">
          <span className="language-flag">🇷🇺</span>
          <span className="language-text">{language}</span>
        </div>
        
        <div className="navbar-profile" onClick={handleProfileClick}>
          <img 
            src={`https://ui-avatars.com/api/?name=${user.username}&background=667eea&color=fff`}
            alt="Profile" 
            className="profile-avatar"
          />
          <div className="profile-info">
            <span className="profile-name">{user.email}</span>
            <span className="profile-role">{user.username}</span>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
