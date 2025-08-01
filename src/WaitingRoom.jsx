import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WaitingRoom() {
  const [userId] = useState(() => crypto.randomUUID()); // or MTurk ID
  const [groupId, setGroupId] = useState(null);
  const navigate = useNavigate();
  const [isWaiting, setIsWaiting] = useState(true);
  const [locked, setLocked] = useState(false);


  useEffect(() => {
    if (!userId) return;

    let intervalId;

    const addToWaitingList = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/waiting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (!res.ok) throw new Error('Failed to add user to waiting list');
        const data = await res.json();
        console.log('User added to waiting list:', data);
        console.log("Assigned group:", data.groupId);
        console.log("Assigned label:", data.label);
        console.log("Current userId:", userId);

        // Begin polling
        /*intervalId = setInterval(async () => {
          try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`);
            const result = await res.json();
            console.log('Polling result:', result);

            if (result.group_id) {
              setGroupId(result.group_id);
              setLocked(true);
              clearInterval(intervalId);
              navigate('/app');
            }
          } catch (err) {
            console.error('Polling failed:', err);
          }
        }, 2000);*/
      } catch (err) {
        console.error('Error posting to waiting list:', err);
      }
    };

    addToWaitingList();

    return () => clearInterval(intervalId);
  }, [userId, setGroupId, setLocked, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`)
        .then(res => res.json())
        .then(data => {
          console.log("Waiting check data:", data);

          if (data.group_id && data.label) {
            setGroupId(data.group_id);
            setUserLabel(data.label);
            setLocked(true);

            localStorage.setItem("groupId", data.group_id);
            localStorage.setItem("userId", userId);
            localStorage.setItem("userLabel", data.label);

            navigate("/app");
          }
        })
        .catch(err => console.error("Error fetching group ID:", err));
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [userId]);



  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Waiting for other participants...</h2>
      <p>You will be assigned to a group as soon as 2 more users join.</p>
    </div>
  );
}
