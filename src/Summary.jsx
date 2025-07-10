import React, { useState, useEffect } from 'react';

export default function Summary({ groupId }) {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    if (!groupId) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/summary/group/${groupId}`)
      .then(res => res.json())
      .then(data => setSummary(data))
      .catch(err => console.error('Failed to fetch summary:', err));
  }, [groupId]);

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
              <th>Parent Ideas</th>
              <th>Child Ideas</th>
            </tr>
          </thead>
          <tbody>
            {summary.map(user => (
              <tr key={user.username}>
                <td>{user.username}</td>
                <td>{user.parent_count}</td>
                <td>{user.child_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
