import React, { useState, useEffect } from 'react';

export default function Summary({ groupId }) {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    const savedGroupId = localStorage.getItem('groupId');
    if (!savedGroupId) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/summary/group/${savedGroupId}`)
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error("Summary fetch error:", err));
  }, []);



  return (
    <div className="app-container">
      <h1>Idea Summary</h1>
      {summary.length === 0 ? (
        <p>No ideas submitted yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Total Ideas</th>
            </tr>
          </thead>
          <tbody>
            {summary.map(user => (
              <tr key={user.username}>
                <td>{user.username}</td>
                <td>{user.idea_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
