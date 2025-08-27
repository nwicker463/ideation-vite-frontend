import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


export default function WaitingRoom() {
  //const [userId, setLocalUserId] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const navigate = useNavigate();
  const [isWaiting, setIsWaiting] = useState(true);
  const [locked, setLocked] = useState(false);
  const [userLabel, setUserLabel] = useState(null);
  const [userId, setUserId] = useState(() => localStorage.getItem("userId") || null);




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


  // Add user to waiting list
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
        }, 2000); */
      } catch (err) {
        console.error('Error posting to waiting list:', err);
      }
    };


    addToWaitingList();


    return () => clearInterval(intervalId);
  }, [userId, setGroupId, setLocked, navigate]);


  // Logging and sending user to App
  useEffect(() => {
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