import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App.jsx';
import Summary from './Summary.jsx';
import Login from './Login.jsx';
import './index.css';

const ProtectedApp = () => {
  const username = localStorage.getItem('username');
  const groupId = localStorage.getItem('groupId');

  if (!username || !groupId) {
    return <Navigate to="/login" />;
  }

  return <App />;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WaitingRoom />} />
        <Route path="/login" element={<Login />} />
        <Route path="/app" element={<ProtectedApp />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="*" element={<Navigate to="/app" />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
