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
  const navigatedRef = useRef(false);

  // On first mount, generate a new ID *only if one does not already exist*
  useEffect(() => {
    if (!userId) {
      const prolificId = new URLSearchParams(window.location.search).get("PROLIFIC_PID");
      const idToUse = prolificId || uuidv4();
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
  /*useEffect(() => {
    let navigated = false;
    if (!userId) return;

    const interval = setInterval(() => {
      fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`)
        .then(res => res.json())
        .then(data => {
          console.log("Polling data:", data); // should show { groupId: "...", label: "User A", ... }


          if (!navigated && data.groupId && data.label) {
            setGroupId(data.groupId);
            setUserLabel(data.label);
            setLocked(true);


            console.log("Saving to localStorage:");
            console.log("userId:", userId);
            console.log("groupId:", data.groupId);
            console.log("userLabel:", data.label);


            localStorage.setItem("groupId", data.groupId);
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


    }, 2000);


    return () => clearInterval(interval);
  }, [userId]);*/
  useEffect(() => {
    if (!userId) return;

    // initial check + polling
    const checkAssignment = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`);
        if (!res.ok) return; // optionally handle 404/500
        const data = await res.json();

        // Only navigate once, when groupId + label are present
        if (!navigatedRef.current && data?.groupId && data?.label) {
          navigatedRef.current = true;       // mark we've navigated
          // persist before navigation
          localStorage.setItem("groupId", data.groupId);
          localStorage.setItem("userLabel", data.label);
          localStorage.setItem("userId", userId);

          // clear poll immediately
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // use replace so back button doesn't bounce
          navigate("/app", { replace: true });
        }
      } catch (err) {
        console.error("Error fetching group assignment:", err);
      }
    };

    // run immediately, then poll
    checkAssignment();
    intervalRef.current = setInterval(checkAssignment, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [userId, navigate]);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Waiting for other participants...</h2>
      <p>You will be assigned to a group as soon as 2 more users join.</p>
      <p></p>
      <p>Please do not reload this page.</p>
    </div>
  );
}