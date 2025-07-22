import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const WaitingRoom = ({ userId, setGroupId, setLocked }) => {
  const navigate = useNavigate();
  const [isWaiting, setIsWaiting] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // First: POST user to waiting list
    fetch(`${import.meta.env.VITE_API_URL}/api/waiting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then(res => res.json())
      .then(data => {
        console.log('User added to waiting list:', data);

        // After successful post, start polling for group assignment
        const interval = setInterval(() => {
          fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`)
            .then(res => res.json())
            .then(data => {
              console.log('Polling group assignment:', data);
              if (data.group_id) {
                setGroupId(data.group_id);
                setLocked(true); // lock the username & group ID
                clearInterval(interval);
                navigate('/app'); // send user into the app
              }
            })
            .catch(err => console.error('Polling error:', err));
        }, 2000); // poll every 2 seconds

        // Cleanup if user leaves
        return () => clearInterval(interval);
      })
      .catch(err => {
        console.error('Error adding user to waiting list:', err);
      });
  }, [userId, setGroupId, setLocked, navigate]);

  return (
    <div className="waiting-room">
      <h2>Waiting Room</h2>
      {isWaiting && <p>Waiting for your group to form...</p>}
    </div>
  );
};

export default WaitingRoom;
