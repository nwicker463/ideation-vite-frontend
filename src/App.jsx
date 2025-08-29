import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import './App.css';
import { Link } from 'react-router-dom';


const conjunctivePhrases = [
  '',
  'More precisely,',
  'However,',
  'On the other hand,',
  'For example,',
];

export default function IdeationGame() {
  const [ideas, setIdeas] = useState([]);
  const [parentId, setParentId] = useState(null);
  const [content, setContent] = useState('');
  const [phrase, setPhrase] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState({});
  const [username, setUsername] = useState(() => localStorage.getItem('userId') || '');
  const [locked, setLocked] = useState(localStorage.getItem('locked') === 'true');
  const [groups, setGroups] = useState([]);
  const [endTime, setEndTime] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [userId, setUserId] = useState(() => localStorage.getItem("userId"));
  const [groupId, setGroupId] = useState(() => localStorage.getItem("groupId")); //CHECK1
  const [userLabel, setUserLabel] = useState(() => localStorage.getItem("userLabel"));
  const [timeLeft, setTimeLeft] = useState(null);

  console.log("userId:", userId);
  console.log("groupId:", groupId);
  console.log("userLabel:", userLabel);

  //logging groupId
  useEffect(() => {
    console.log("groupId state after render:", groupId);
    console.log("groupId in localStorage after render:", localStorage.getItem("groupId"));
  }, [groupId]);

  useEffect(() => {
    if (!endTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);


  // Load saved username on mount
  useEffect(() => {
    const saved = localStorage.getItem('username');
    if (saved) setUsername(saved);
  }, []);

  // Save username on change
  useEffect(() => {
    if (username) {
      localStorage.setItem('username', username);
    }
  }, [username]);

  /* -------------------------------------------
    Load a saved groupId (if present) exactly
    once when the component first mounts.
  --------------------------------------------*/
  useEffect(() => {
    const saved = localStorage.getItem('groupId');
    if (saved) {
      setGroupId(Number(saved)); //CHECK2
      console.log("groupId 2:", groupId);
    }
  }, []);

  useEffect(() => {
    if (!groupId) return;

    const fetchIdeas = () => {
      fetch(`${import.meta.env.VITE_API_URL}/api/ideas/group/${groupId}`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setIdeas(data);
          } else {
            console.warn('Unexpected idea data:', data);
            setIdeas([]);
          }
        })
        .catch(err => {
          console.error('Failed to fetch ideas:', err);
          setIdeas([]);
        });
      };

    // Initial fetch
    fetchIdeas();

    // Poll every 5 seconds
    const interval = setInterval(fetchIdeas, 5000);

    // Cleanup on group change or unmount
    return () => clearInterval(interval);
  }, [groupId]);

  /* Fetching groups*/
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/groups`)
      .then((res) => res.json())
      .then((data) => setGroups(data))
      .catch((err) => {
        console.error('Failed to fetch groups:', err);
        setGroups([]);
      });
  }, []);

const submitIdea = async () => {
  const contentToSubmit = phrase ? `${phrase} ${content}` : content;

  const currentGroupId = groupId || localStorage.getItem("groupId");
  const currentUserLabel = userLabel || localStorage.getItem("userLabel");
  const currentUserId = userId || localStorage.getItem("userId");

  if (!currentGroupId) {
    alert("Please select or create a group first.");
    return;
  }

  if (!currentUserId) {
    alert("No user ID.");
    return;
  }

  console.log('Submitting idea:', {
    content,
    parentId,
    groupId,
    userId
  });

  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ideas/group/${currentGroupId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: contentToSubmit,
      parentId,
      userId: currentUserId   // <-- send actual UUID, not label
    })
  });

  if (res.ok) {
    setContent('');
    setPhrase('');
    setParentId(null);
  }
};


  const toggleCollapse = (id) => {
    setCollapsedNodes(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('collapsedNodes');
    if (saved) {
      try {
        setCollapsedNodes(JSON.parse(saved));
      } catch (e) {
        console.warn("Couldn't parse saved collapsed nodes:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('collapsedNodes', JSON.stringify(collapsedNodes));
  }, [collapsedNodes]);

  useEffect(() => {
    const savedPhrase = localStorage.getItem('phrase');
    if (savedPhrase !== null) {
      setPhrase(savedPhrase);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('phrase', phrase);
  }, [phrase]);

  useEffect(() => {
    const savedContent = localStorage.getItem('ideaContent');
    if (savedContent !== null) {
      setContent(savedContent);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ideaContent', content);
  }, [content]);

  // Fetch the user info after joining a group
  useEffect(() => {
    if (!userId) return;
    fetch(`${import.meta.env.VITE_API_URL}/api/waiting/${userId}`)
      .then(res => res.json())
      .then(data => {
        setGroupId(data.group_id); //CHECK3
        console.log("groupId 3:", groupId);
        setUserLabel(data.label);
        localStorage.setItem("userLabel", data.label);
      });
  }, [userId]);

  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');

  // Poll messages every 3s
  useEffect(() => {
    if (!groupId) return;
    const fetchMessages = () =>
      fetch(`${import.meta.env.VITE_API_URL}/api/messages/group/${groupId}`)
        .then(res => res.json())
        .then(data => setMessages(Array.isArray(data) ? data : []))
        .catch(err => {
          console.error('Chat fetch error:', err);
          setMessages([]); // keep it an array on error
        });


    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [groupId]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !username || !groupId) return;
    const currentGroupId = groupId || localStorage.getItem("groupId");
    const currentUserId = userId || localStorage.getItem("userId");
    const currentUserLabel = userLabel || localStorage.getItem("userLabel");

    console.log({ chatInput, currentUserId, currentUserLabel });

    await fetch(`${import.meta.env.VITE_API_URL}/api/messages/group/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: chatInput,
        userId: currentUserId,
        username: currentUserLabel
      }),
    });

    setChatInput('');
  };

  //possibly delete?
  //countdown logic
    useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

  //possibly delete?
  //refresh timer when switching groups
  useEffect(() => {
    if (!groupId) return;
    const groupKey = `timer-${groupId}`;
    const stored = localStorage.getItem(groupKey);
    const defaultTime = 600; // Change this to your desired default
    const initial = stored ? parseInt(stored) : defaultTime;

    setTimeLeft(initial);
    setTimerActive(initial > 0);
  }, [groupId]);

  //resync states if they are null
  useEffect(() => {
    if (!userId) setUserId(localStorage.getItem("userId"));
    if (!groupId) setGroupId(localStorage.getItem("groupId")); //CHECK4
    console.log("groupId 4:", groupId);
    if (!userLabel) setUserLabel(localStorage.getItem("userLabel"));
  }, []);

  //Rehydrate groupId
  useEffect(() => {
    if (!groupId) {
      const stored = localStorage.getItem("groupId");
      if (stored && stored !== "null") {
        setGroupId(stored);
      }
    }
  }, [groupId]);
  
  //fetching endtime for timer
  useEffect(() => {
    if (!groupId) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/time`)
      .then(res => res.json())
      .then(data => {
        const { endTime } = data;
        const interval = setInterval(() => {
          const now = Date.now();
          const diff = endTime - now;
          setTimeLeft(Math.max(0, diff));
        }, 1000);

        return () => clearInterval(interval);
      })
      .catch(err => console.error('Failed to fetch group time:', err));
  }, [groupId]);


  const renderTree = (parentId = null, level = 0) => {
    return ideas
      .filter(idea => idea.parent_id === parentId)
      .map(idea => {
        const isCollapsed = collapsedNodes[idea.id];

        return (
          <div key={idea.id} className="child-indent" style={{ marginLeft: `${level * 20}px` }}>
            <div className="idea-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0 }}>
                  <span
                    style={{ cursor: 'pointer', marginRight: '8px', userSelect: 'none' }}
                    onClick={() => toggleCollapse(idea.id)}
                  >
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                  <strong>{idea.contributor_label || 'Anonymous'}:</strong> {idea.content}
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setParentId(parentId === idea.id ? null : idea.id); // Toggle selection
                  }}
                  className={parentId === idea.id ? 'selected-button' : 'unselected-button'}
                >
                  Build on
                </Button>

              </div>
            </div>

            {!isCollapsed && renderTree(idea.id, level + 1)}
          </div>
        );
      });
  };

  return (
    <div className="app-container">
    <h1>Ideation Game</h1>
    <Link to="/summary">View Summary</Link>
    {/*<Button onClick={async () => {
      await fetch(`${import.meta.env.VITE_API_URL}/api/groups/${groupId}/timer/start`, {
        method: 'POST'
      });
      window.location.reload(); // re-fetch and re-sync the timer
    }}>
      Start Timer
    </Button> */}

    {/*<div className="text-xl font-semibold">
      Time Left: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}

      {!timerActive && (
        <p className="text-red-600 mt-2">Time's up! You can no longer submit ideas.</p>
      )}

    </div>*/}

    <div>
      Time left: {Math.floor(timeLeft / 1000 / 60)}:
                {(Math.floor(timeLeft / 1000) % 60).toString().padStart(2, '0')}
    </div>

    <div className="content-grid">
      {/* Left Column: Idea Tree */}
      <div className="idea-tree">
        <h2>Idea Tree</h2>
        {renderTree()}
      </div>

      {/* Middle Column: Form */}
      <div className="idea-form">
        {/*Locked Group Stuff*/}
        <div>
          <p>User ID: {userId || localStorage.getItem("userId")}</p>
          <p>Group ID: {groupId || localStorage.getItem("groupId")}</p>
          <p>Label: {userLabel || localStorage.getItem("userLabel")}</p>
        </div>
        <h2>Add a New Idea</h2>

        {/* <button onClick={createGroup}>Create New Group</button> */}

        <div className="input-group">
          <label>Conjunctive Phrase</label>
          <select value={phrase} onChange={e => setPhrase(e.target.value)}>
            {conjunctivePhrases.map(p => (
              <option key={p} value={p}>{p || '[None]'}</option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>Your Idea</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Enter your idea..."
          />
        </div>
        <Button onClick={submitIdea} disabled={!timerActive}>
          Submit Idea
        </Button>
      </div>

      <div className="chat-box">
        <h2>Group Chat</h2>
        <div className="chat-messages">
          {Array.isArray(messages) &&
            messages.map(msg => (
              <p key={msg.id}>
                <strong>{msg.username}:</strong> {msg.content}
              </p>
            ))}

        </div>
        <textarea
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  </div>

  );
}
