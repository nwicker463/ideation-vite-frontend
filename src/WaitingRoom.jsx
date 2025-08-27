import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

export default function WaitingRoom() {
  const navigate = useNavigate();

  // Load existing userId from localStorage if it exists
  const [userId, setUserId] = useState(() => localStorage.getItem("userId") || null);
  const [groupId, setGroupId] = useState(null);
  const [locked, setLocked] = useState(false);

  // On first mount, generate a new ID *only if one does not already exist*
  useEffect(() => {
    if (!userId) {
      const prolificId = new URLSearchParams(window.location.search).get("PROLIFIC_PID");
      const idToUse = prolificId || uuidv4();

      localStorage.setItem("userId", idToUse);
      setUserId(idToUse);

      // Post to backend waiting list once
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: idToUse }),
      }).catch(err => console.error("Failed to register user in waiting list:", err));
    }
  }, [userId]);

  // Poll backend for group assignment
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`)
        .then(res => res.json())
        .then(data => {
          console.log("Waiting check:", data);
          if (data.groupId) {
            setGroupId(data.groupId);
            setLocked(true);

            localStorage.setItem("groupId", data.groupId);
            localStorage.setItem("userLabel", data.label);

            navigate("/app");
          }
        })
        .catch(err => console.error("Error fetching group assignment:", err));
    }, 2000);

    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div>
      <h1>Waiting Room</h1>
      <p>User ID: {userId}</p>
      <p>Group ID: {groupId || "Not assigned yet"}</p>
      {locked && <p>Locked in group.</p>}
    </div>
  );
}