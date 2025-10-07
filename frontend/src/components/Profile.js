import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Profile() {
  const { user, logout } = useAuth();
  const { isSidebarOpen } = useSidebar();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <Sidebar />
        <div className={`dashboard-main ${!isSidebarOpen ? 'dashboard-main-expanded' : ''}`}>
          <div className="profile-page">
            <div className="profile-header">
              <div className="profile-header-content">
                <img 
                  src={`https://ui-avatars.com/api/?name=${user.username}&background=667eea&color=fff&size=120`}
                  alt="Profile" 
                  className="profile-page-avatar"
                />
                <div className="profile-header-info">
                  <h1 className="profile-username">{user.username}</h1>
                  <p className="profile-email">{user.email}</p>
                  <span className={`profile-status ${user.is_active ? 'active' : 'inactive'}`}>
                    {user.is_active ? '● Активен' : '● Неактивен'}
                  </span>
                </div>
              </div>
              <button className="profile-edit-btn">
                Редактировать профиль
              </button>
            </div>

            <div className="profile-content">
              <div className="profile-section">
                <h2 className="profile-section-title">Личная информация</h2>
                <div className="profile-info-grid">
                  <div className="profile-info-item">
                    <label>ID пользователя</label>
                    <p>{user.id}</p>
                  </div>
                  <div className="profile-info-item">
                    <label>Имя пользователя</label>
                    <p>{user.username}</p>
                  </div>
                  <div className="profile-info-item">
                    <label>Email</label>
                    <p>{user.email}</p>
                  </div>
                  <div className="profile-info-item">
                    <label>Дата регистрации</label>
                    <p>{formatDate(user.created_at)}</p>
                  </div>
                  <div className="profile-info-item">
                    <label>Статус аккаунта</label>
                    <p>{user.is_active ? 'Активный' : 'Неактивный'}</p>
                  </div>
                </div>
              </div>

              <div className="profile-section">
                <h2 className="profile-section-title">Действия с аккаунтом</h2>
                <div className="profile-actions">
                  <button className="profile-action-btn secondary">
                    Изменить пароль
                  </button>
                  <button className="profile-action-btn danger" onClick={handleLogout}>
                    Выйти из аккаунта
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;

