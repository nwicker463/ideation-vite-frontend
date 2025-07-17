import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WaitingRoom() {
  const [userId] = useState(() => crypto.randomUUID()); // or MTurk ID
  const [groupId, setGroupId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Join the waiting room
    fetch(`${import.meta.env.VITE_API_URL}/api/waiting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    // Poll every 2 seconds to check for group assignment
    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`)
        .then(res => res.json())
        .then(data => {
          if (data.groupId) {
            setGroupId(data.groupId);
            clearInterval(interval);
            navigate('/app', { state: { userId, groupId } });
          }
        });
    }, 2000);

    return () => clearInterval(interval);
  }, [navigate, userId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Waiting for other participants...</h2>
      <p>You will be assigned to a group as soon as 2 more users join.</p>
    </div>
  );
}
