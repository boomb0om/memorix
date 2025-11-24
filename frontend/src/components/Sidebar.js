import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';

function Sidebar() {
  const { logout } = useAuth();
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: '💬', label: 'Чат', path: '/chat' },
    { icon: '📄', label: 'Документы', path: '/documents' },
    { icon: '📝', label: 'Конспекты', path: '/notes' },
    { icon: '📚', label: 'Курсы', path: '/courses' },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
  };

  return (
    <>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}
      <div className={`sidebar ${!isSidebarOpen ? 'sidebar-hidden' : ''}`}>
        <div className="sidebar-menu">
          {menuItems.map((item, index) => (
            <div 
              key={index} 
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => handleMenuClick(item.path)}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </div>
          ))}
        </div>
        
        <div className="sidebar-footer">
          <div className="sidebar-item" onClick={() => navigate('/profile')}>
            <span className="sidebar-icon">⚙️</span>
            <span className="sidebar-label">Settings</span>
          </div>
          <div className="sidebar-item" onClick={logout}>
            <span className="sidebar-icon">🚪</span>
            <span className="sidebar-label">Logout</span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;

