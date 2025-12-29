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
    { icon: '📚', label: 'Курсы', path: '/courses' },
    { icon: '📝', label: 'Конспекты', path: '/notes' },
    { icon: '📄', label: 'Документы', path: '/documents' },
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
              className={`sidebar-item ${location.pathname === item.path ? 'active' : ''} ${item.disabled ? 'sidebar-item-disabled' : ''}`}
              onClick={item.disabled ? undefined : () => handleMenuClick(item.path)}
              style={item.disabled ? { cursor: 'not-allowed' } : {}}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
              {item.soon && <span className="sidebar-soon">SOON</span>}
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

