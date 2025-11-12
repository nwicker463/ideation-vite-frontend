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

    const checkAssignment = async () => {
      /*fetch(`${import.meta.env.VITE_API_URL}/api/waiting/check-group`, {
        method: "POST"
      });*/
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`)
        .then(res => res.json())
        .then(data => {
          console.log("Poll result:", data);
          if (data.groupId && data.label) {
            localStorage.setItem("groupId", data.groupId);
            localStorage.setItem("userId", userId);
            localStorage.setItem("userLabel", data.label);
            navigate("/app");
          }
        });
      /*fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}/heartbeat`, {
        method: "POST",
      }).catch((err) => console.error("Heartbeat failed:", err));*/
    };

    // run immediately then poll
    checkAssignment();
    intervalRef.current = setInterval(checkAssignment, 1000);

    return () => {
      /*if (intervalRef.current) */clearInterval(intervalRef.current);
    };
  }, [userId, navigate]);

  return (
    <div className="p-6">
      <h2>Waiting for participants...</h2>
      <p>Do not reload this page.</p>
    </div>
  );
}
