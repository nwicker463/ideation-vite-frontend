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
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/check-group`, {
        method: "POST"
      });
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`);
        if (!res.ok) {
          // don't navigate on 404/500; just log and retry
          console.warn("Waiting GET failed:", res.status);
          return;
        }
        const data = await res.json();
        console.log("Polling result:", data);

        if (!navigatedRef.current && data?.groupId && data?.label) {
          navigatedRef.current = true;

          // persist before navigating
          localStorage.setItem("groupId", data.groupId);
          localStorage.setItem("userLabel", data.label);
          localStorage.setItem("userId", userId);

          // stop polling immediately
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // navigate once, replace so back button won't bounce
          console.log("NAVIGATE called:", "/app", new Date().toISOString(), "from", /* component name */);
          navigate("/app", { replace: true });
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
      /*fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}/heartbeat`, {
        method: "POST",
      }).catch((err) => console.error("Heartbeat failed:", err));*/
    };

    // run immediately then poll
    checkAssignment();
    intervalRef.current = setInterval(checkAssignment, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, navigate]);

  return (
    <div className="p-6">
      <h2>Waiting for participants...</h2>
      <p>Do not reload this page.</p>
    </div>
  );
}
