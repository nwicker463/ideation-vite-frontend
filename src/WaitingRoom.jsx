// WaitingRoom.jsx
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function WaitingRoom() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(() => localStorage.getItem("userId") || null);
  const navigatedRef = useRef(false);      // prevents repeat navigation
  const intervalRef = useRef(null);

  // 1) generate userId only if missing
  useEffect(() => {
    if (!userId) {
      const prolificId = new URLSearchParams(window.location.search).get("PROLIFIC_PID");
      const idToUse = prolificId || uuidv4();
      localStorage.setItem("userId", idToUse);
      setUserId(idToUse);
      console.log("Generated userId:", idToUse);
    }
  }, [userId]);

  // 2) register user once userId exists
  useEffect(() => {
    if (!userId) return;
    console.log("Posting to waiting:", userId);

    fetch(`${import.meta.env.VITE_API_URL}/api/waiting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    }).catch(err => console.error("Register failed:", err));
  }, [userId]);

  // 3) poll for assignment and navigate exactly once
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`)
        .then(res => res.json())
        .then(data => {
          console.log("Polling result:", data);
          if (data.group_id && data.label) {
            const groupId = data.group_id || data.groupId;
            const userLabel = data.label || data.userLabel;

            console.log("NAVIGATE -> /app from WaitingRoom", new Date().toISOString(), {
              userId,
              groupId,
              userLabel,
            });
            
            localStorage.setItem("groupId", data.group_id);
            localStorage.setItem("userId", userId);
            localStorage.setItem("userLabel", data.label);
            navigate("/app");
          }
        })
        .catch(err => console.error("Polling error:", err));
    }, 2000);

    return () => clearInterval(interval);
  }, [userId, navigate]);

  return (
    <div className="p-6">
      <h2>Waiting for participants...</h2>
      <p>Do not reload this page.</p>
    </div>
  );
}
