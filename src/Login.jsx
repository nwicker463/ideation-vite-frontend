import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [groupId, setGroupId] = useState(localStorage.getItem('groupId'));
    const [username, setUsername] = useState(localStorage.getItem('username'));
    const [locked, setLocked] = useState(!!groupId && !!username);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username || !groupId) return alert('Please fill out both fields');

    //localStorage.setItem('username', userId);
    localStorage.setItem('groupId', groupId);
    localStorage.setItem('locked', true);
    navigate('/app'); // go to the main app
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Join a Group</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold mb-1">Username</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Group ID</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white rounded px-4 py-2 hover:opacity-90">
          Enter App
        </button>
      </form>
    </div>
  );
}
