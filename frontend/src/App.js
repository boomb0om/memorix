import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Notes from './components/Notes';
import Courses from './components/Courses';
import Navbar from './components/Navbar';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/chat" /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/chat" /> : <Register />} 
          />
          <Route 
            path="/chat" 
            element={user ? (
              <SidebarProvider>
                <Navbar />
                <Dashboard />
              </SidebarProvider>
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/dashboard" 
            element={<Navigate to="/chat" />} 
          />
          <Route 
            path="/profile" 
            element={user ? (
              <SidebarProvider>
                <Profile />
              </SidebarProvider>
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/notes" 
            element={user ? (
              <SidebarProvider>
                <Navbar />
                <Notes />
              </SidebarProvider>
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/courses" 
            element={user ? (
              <SidebarProvider>
                <Navbar />
                <Courses />
              </SidebarProvider>
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/courses/:courseId" 
            element={user ? (
              <SidebarProvider>
                <Navbar />
                <Courses />
              </SidebarProvider>
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/courses/:courseId/lessons/:lessonId" 
            element={user ? (
              <SidebarProvider>
                <Navbar />
                <Courses />
              </SidebarProvider>
            ) : <Navigate to="/login" />} 
          />
          <Route 
            path="/" 
            element={<Navigate to={user ? "/chat" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
