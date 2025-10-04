import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <h1>Auth App</h1>
      <div>
        <span style={{ marginRight: '15px' }}>Привет, {user.username}!</span>
        <button onClick={logout}>Выйти</button>
      </div>
    </nav>
  );
}

export default Navbar;
