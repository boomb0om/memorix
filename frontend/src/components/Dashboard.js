import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useSidebar } from '../contexts/SidebarContext';

function Dashboard() {
  const [message, setMessage] = useState('');
  const { isSidebarOpen } = useSidebar();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      console.log('Отправлено сообщение:', message);
      // Здесь будет логика отправки сообщения
      setMessage('');
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className={`dashboard-main ${!isSidebarOpen ? 'dashboard-main-expanded' : ''}`}>
        <div className="chat-container">
          <div className="chat-welcome">
            <h1 className="chat-title">С чего начнем?</h1>
          </div>
          
          <div className="chat-input-wrapper">
            <form onSubmit={handleSubmit} className="chat-form">
              <div className="chat-input-container">
                <button type="button" className="chat-attach-btn">
                  <span>+</span>
                </button>
                <input
                  type="text"
                  className="chat-input"
                  placeholder="Спросите что-нибудь..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button type="button" className="chat-voice-btn">
                  <span>🎤</span>
                </button>
                <button type="submit" className="chat-send-btn" disabled={!message.trim()}>
                  <span>⬆</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
