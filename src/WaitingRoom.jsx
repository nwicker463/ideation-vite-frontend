// WaitingRoom.jsx
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function WaitingRoom() {
  const navigate = useNavigate();
  const [user_id, setUserId] = useState(() => localStorage.getItem("user_id") || null);
  const navigatedRef = useRef(false);      // prevents repeat navigation
  const intervalRef = useRef(null);

  // 1) generate user_id only if missing
  useEffect(() => {
    if (!user_id) {
      const prolificId = new URLSearchParams(window.location.search).get("PROLIFIC_PID");
      const idToUse = prolificId || uuidv4();
      localStorage.setItem("user_id", idToUse);
      setUserId(idToUse);
      console.log("Generated user_id:", idToUse);
    }
  }, [user_id]);

  // 2) register user once user_id exists
  useEffect(() => {
    if (!user_id) return;
    console.log("Posting to waiting:", user_id);

    fetch(`${import.meta.env.VITE_API_URL}/api/waiting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id })
    }).catch(err => console.error("Register failed:", err));
  }, [user_id]);

  // 3) poll for assignment and navigate exactly once
  useEffect(() => {
    if (!user_id) return;

    const checkAssignment = async () => {
      /*fetch(`${import.meta.env.VITE_API_URL}/api/waiting/check-group`, {
        method: "POST"
      });*/
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${user_id}`)
        .then(res => res.json())
        .then(data => {
          console.log("Poll result:", data);
          if (data.groupId && data.label) {
            localStorage.setItem("groupId", data.groupId);
            localStorage.setItem("user_id", user_id);
            localStorage.setItem("userLabel", data.label);
            navigate("/app");
          }
        });
      /*fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${user_id}/heartbeat`, {
        method: "POST",
      }).catch((err) => console.error("Heartbeat failed:", err));*/
    };

    // run immediately then poll
    checkAssignment();
    intervalRef.current = setInterval(checkAssignment, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [user_id, navigate]);

  return (
    <div className="p-6">
      <h2>Waiting for participants...</h2>
      <p>Do not reload this page.</p>
    </div>
  );
}
