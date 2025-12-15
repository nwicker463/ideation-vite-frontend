import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function WaitingRoom() {
  const [groupId, setGroupId] = useState(null);
  const navigate = useNavigate();
  const [isWaiting, setIsWaiting] = useState(true);
  const [locked, setLocked] = useState(false);
  const [userLabel, setUserLabel] = useState(null);
  const [userId, setUserId] = useState(() => null);

  //const params = new URLSearchParams(window.location.search);
  //const prolificId = params.get("prolific_id") || null;

  // On first mount, generate a new ID *only if one does not already exist*
  useEffect(() => {
    if (!userId) {
      const params = new URLSearchParams(window.location.search).get("prolific_id");
      const idToUse = params || uuidv4();
      //localStorage.setItem("userId", idToUse);
      setUserId(idToUse);
      // Post to backend waiting list once
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: idToUse }),
      }).catch(err => console.error("Failed to register user in waiting list:", err));
    }
  }, [userId]);

  // Logging and sending user to App
  useEffect(() => {
    let navigated = false;
    if (!userId) return;

    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`)
        .then(res => res.json())
        .then(data => {
          console.log("Polling data:", data); // should show { groupId: "...", label: "User A", ... }


          if (!navigated && data.group_id && data.label) {
            setGroupId(data.group_id);
            setUserLabel(data.label);
            setLocked(true);

          
            console.log("Saving to localStorage:");
            console.log("userId:", userId);
            console.log("groupId:", data.group_id);
            console.log("userLabel:", data.label);


            localStorage.setItem("groupId", data.group_id);
            localStorage.setItem("userId", userId);
            localStorage.setItem("userLabel", data.label);


            navigated = true;
            navigate("/app");
          }
        })
        .catch(err => console.error("Error fetching group ID:", err));


      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}/heartbeat`, {
        method: "POST"
      });

      try {
          const result = db.query(`
            DELETE FROM waiting_users
            WHERE last_heartbeat < NOW() - INTERVAL '30 seconds'
              AND group_id IS NULL
            RETURNING user_id
          `);

          if (result.rows.length > 0) {
            console.log('🧹 Removed inactive users:', result.rows.map(r => r.user_id));
          }
        } catch (err) {
          console.error('Heartbeat cleanup failed:', err);
        }

    }, 2000);


    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Waiting for other participants...</h2>
      <p>You will be assigned to a group as soon as 2 more users join.</p>
      <p></p>
      <p>Please do not reload this page.</p>
    </div>
  );
}