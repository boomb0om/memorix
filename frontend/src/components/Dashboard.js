import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <h2>Добро пожаловать!</h2>
      <div className="user-info">
        <h3>Информация о пользователе:</h3>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Имя пользователя:</strong> {user.username}</p>
        <p><strong>Статус:</strong> {user.is_active ? 'Активен' : 'Неактивен'}</p>
        <p><strong>Дата регистрации:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

export default Dashboard;
