import React, { useState, useEffect } from 'react';

export default function Summary({ groupId }) {
  const [summary, setSummary] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/summary/group/${groupId}`)
      .then(res => {
        console.log("Fetch response:", res);
        return res.json();
      })
      .then(data => {
        console.log("Summary data received:", data);
        setSummary(data);
      })
      .catch(err => {
        console.error("Failed to fetch summary:", err);
      });
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
