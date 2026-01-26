import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import './App.css';
import { Link } from 'react-router-dom';
import ChatColumn from "./ChatColumn";

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
  const [groups, setGroups] = useState([]);
  const [endTime, setEndTime] = useState(null);
  const [timerActive, setTimerActive] = useState(false);
  const [userId, setUserId] = useState(() => localStorage.getItem("userId"));
  const [groupId, setGroupId] = useState(() => localStorage.getItem("groupId")); //CHECK1
  const [userLabel, setUserLabel] = useState(() => localStorage.getItem("userLabel"));
  const [timeLeft, setTimeLeft] = useState(null);

  /*console.log("userId:", userId);
  console.log("groupId:", groupId);
  console.log("userLabel:", userLabel);*/

  //logging groupId
  /*useEffect(() => {
    console.log("groupId state after render:", groupId);
    console.log("groupId in localStorage after render:", localStorage.getItem("groupId"));
  }, [groupId]);*/

  // Setting time left
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


  // Load a saved groupId when the component first mounts
  useEffect(() => {
    const saved = localStorage.getItem('groupId');
    if (saved) {
      setGroupId(Number(saved)); //CHECK2
      /*console.log("groupId 2:", groupId);*/
    }
  }, []);

  // Polling for ideas
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
          console.error("Error fetching ideas:", err.message, err.stack);
          res.status(500).json({ error: err.message });
        });
      };

    // Initial fetch
    fetchIdeas();

    // Poll every 5 seconds
    const interval = setInterval(fetchIdeas, 3000);

    // Cleanup on group change or unmount
    return () => clearInterval(interval);
  }, [groupId]);

  // Fetching groups
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/groups`)
      .then((res) => res.json())
      .then((data) => setGroups(data))
      .catch((err) => {
        console.error('Failed to fetch groups:', err);
        setGroups([]);
      });
  }, []);

  // Submit an idea
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
      contentToSubmit,
      parentId,
      currentGroupId,
      currentUserId,
      currentUserLabel
    });

    console.log()

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ideas/group/${currentGroupId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        /*content: contentToSubmit,
        parentId,
        userId: currentUserId*/
        content: contentToSubmit,
        parent_id: parentId,
        group_id: currentGroupId,
        contributor_label: currentUserLabel,
        user_id: currentUserId,
      })
    });

    if (res.ok) {
      setContent('');
      setPhrase('');
      setParentId(null);
    }
  };

  // Toggle node collapse
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

  // Set content of collapsed node
  useEffect(() => {
    localStorage.setItem('collapsedNodes', JSON.stringify(collapsedNodes));
  }, [collapsedNodes]);

  // Get the current chosen phrase
  useEffect(() => {
    const savedPhrase = localStorage.getItem('phrase');
    if (savedPhrase !== null) {
      setPhrase(savedPhrase);
    }
  }, []);

  // Set phrase
  useEffect(() => {
    localStorage.setItem('phrase', phrase);
  }, [phrase]);

  // Get current idea content
  useEffect(() => {
    const savedContent = localStorage.getItem('ideaContent');
    if (savedContent !== null) {
      setContent(savedContent);
    }
  }, []);

  // Set content
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
        /*console.log("groupId 3:", groupId);*/
        setUserLabel(data.label);
        localStorage.setItem("userLabel", data.label);
      });
  }, [userId]);

  /*const [messages, setMessages] = useState([]);*/
  const [chatInput, setChatInput] = useState('');

  // Countdown logic
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


  // Refresh timer when switching groups
  useEffect(() => {
    if (!groupId) return;
    const groupKey = `timer-${groupId}`;
    const stored = localStorage.getItem(groupKey);
    const defaultTime = 600; // Change this to your desired default
    const initial = stored ? parseInt(stored) : defaultTime;

    setTimeLeft(initial);
    setTimerActive(initial > 0);
  }, [groupId]);

  // Resync states if they are null
  useEffect(() => {
    if (!userId) setUserId(localStorage.getItem("userId"));
    if (!groupId) setGroupId(localStorage.getItem("groupId")); //CHECK4a
    /*console.log("groupId 4:", groupId);*/
    if (!userLabel) setUserLabel(localStorage.getItem("userLabel"));
  }, []);

  // Rehydrate groupId
  useEffect(() => {
    if (!groupId) {
      const stored = localStorage.getItem("groupId");
      if (stored && stored !== "null") {
        setGroupId(stored);
      }
    }
  }, [groupId]);
  
  // Fetching endtime for timer
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

  // Render idea tree
  const renderTree = (currentParentId = null, level = 0) => {
    return ideas
      .filter(idea => idea.parent_id === currentParentId)
      .map(idea => {
        const isCollapsed = collapsedNodes[idea.id];
        return (
          <div key={idea.id} className="child-indent" style={{ marginLeft: `${level * 20}px` }}>
            <div className={parentId === idea.id ? "idea-card-selected" : "idea-card"}>
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
                  {parentId === idea.id ? "Cancel" : "Build"}
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
    {/*<Link to="/summary">View Summary</Link>*/}
    <h2>Your team's task will be to create a future technology. 
        That is, with your team imagine a technology that will exist in 100 years that solves a major global issue 
        (e.g., water scarcity, misinformation, urban overcrowding). 
        Describe how it works, how it changes society, and what unintended consequences it might have.
        Do your best and try to have fun with this - enter as many and as crazy ideas as you can manage in 10 minutes. 
        We are interested in ideas that are unique and creative.</h2>
    {/*<div>
      Time left: {Math.floor(timeLeft / 1000 / 60)}:
                {(Math.floor(timeLeft / 1000) % 60).toString().padStart(2, '0')}
    </div>*/}
    <div className="text-center mt-6">
      {timeLeft > 0 ? (
        <p className="text-lg font-bold">
          Time left: {Math.floor(timeLeft / 1000 / 60)}:
                {(Math.floor(timeLeft / 1000) % 60).toString().padStart(2, '0')}
        </p>
      ) : (
        <a
          /*href="https://app.prolific.co/submissions/complete?cc=XXXXXXX"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline font-bold"*/
          href ="https://app.prolific.com/submissions/complete?cc=CHUUWJ1P"
        >
          Claim Your Reward!
        </a>
      )}
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
          <p>Your Label: {userLabel || localStorage.getItem("userLabel")}</p>
        </div>
        <h2>Add a New Idea</h2>

        <div className="input-group">
          {/*<label>Conjunctive Phrase</label>
          <select value={phrase} onChange={e => setPhrase(e.target.value)}>
            {conjunctivePhrases.map(p => (
              <option key={p} value={p}>{p || '[None]'}</option>
            ))}
          </select>
          <label>Your Idea</label>*/}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Enter your idea..."
            className="idea-textarea"
          />
        </div>
        <Button onClick={submitIdea} disabled={!timerActive} className={'unselected-button'}>
          Submit
        </Button>
      </div>

      <div>
        <ChatColumn
          currentGroupId={groupId}
          currentUserId={userId}
          currentUserLabel={userLabel}
        />
      </div>
      
      </div>
    </div>
  );
}
