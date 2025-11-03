import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function WaitingRoom() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState(() => localStorage.getItem("userId") || null);
  const [groupId, setGroupId] = useState(null);
  const [userLabel, setUserLabel] = useState(null);

  // 1) Generate / load userId once
  useEffect(() => {
    if (!userId) {
      const prolificId = new URLSearchParams(window.location.search).get("PROLIFIC_PID");
      const newId = prolificId || uuidv4();
      localStorage.setItem("userId", newId);
      setUserId(newId);
      console.log("✅ Generated new userId:", newId);
    }
  }, [userId]);

  // 2) Post to waiting list *only after* userId exists
  useEffect(() => {
    if (!userId) return;

    console.log("➡️ Posting user to waiting list:", userId);

    fetch(`${import.meta.env.VITE_API_URL}/api/waiting`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    }).catch(err => console.error("Failed to register in waiting list:", err));

  }, [userId]); // <- only runs *after* userId is set

  // 3) Poll for group assignment
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`)
        .then(res => res.json())
        .then(data => {
          console.log("👀 Polling result:", data);

          if (data.groupId && data.label) {
            setGroupId(data.groupId);
            setUserLabel(data.label);

            localStorage.setItem("groupId", data.groupId);
            localStorage.setItem("userLabel", data.label);

            navigate("/app");
          }
        })
        .catch(err => console.error("Error polling group assignment:", err));

      // send heartbeat
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}/heartbeat`, {
        method: "POST"
      });

    }, 2000);

    return () => clearInterval(interval);
  }, [userId, navigate]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Waiting for other participants...</h2>
      <p>You will be assigned to a group shortly.</p>
      <p>Do not refresh this page.</p>
    </div>
  );
}