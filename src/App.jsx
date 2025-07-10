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
  const [groupId, setGroupId] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [parentId, setParentId] = useState(null);
  const [content, setContent] = useState('');
  const [phrase, setPhrase] = useState('');
  const [collapsedNodes, setCollapsedNodes] = useState({});
  const [username, setUsername] = useState('');

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
      setGroupId(Number(saved));
    }
  }, []);

  /* -------------------------------------------
    Whenever groupId changes, persist it.
  --------------------------------------------*/
  useEffect(() => {
    if (groupId !== null) {
      localStorage.setItem('groupId', groupId);
    } else {
      localStorage.removeItem('groupId');   // Optional: clear when null
    }
  }, [groupId]);

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



  const submitIdea = async () => {
    if (!groupId) {
      alert('Please select or create a group first.');
      return;
    }

    const fullContent = phrase ? `${phrase} ${content}` : content;

    await fetch(`${import.meta.env.VITE_API_URL}/api/ideas/group/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentId,
        content: fullContent,
        username,
      }),
    });

    setContent('');
    setPhrase('');
    localStorage.removeItem('ideaContent');
    localStorage.removeItem('phrase');
    setParentId(null);

    const updated = await fetch(`${import.meta.env.VITE_API_URL}/api/ideas/group/${groupId}`)
      .then(res => res.json());

    setIdeas(updated);
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

    await fetch(`${import.meta.env.VITE_API_URL}/api/messages/group/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, content: chatInput }),
    });

    setChatInput('');
  };


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
                  <strong>{idea.username || 'Anonymous'}:</strong> {idea.content}
                </p>
                <button onClick={() => setParentId(idea.id)}>Build</button>
              </div>
            </div>

            {!isCollapsed && renderTree(idea.id, level + 1)}
          </div>
        );
      });
  };


  const createGroup = async () => {
    const name = prompt("Enter a name for the new group:");
    if (!name) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const newGroup = await res.json();
      setGroupId(newGroup.id); // Switch to new group
    } catch (err) {
      console.error('Failed to create group:', err);
      alert('Group creation failed.');
    }
  };


  return (
    <div className="app-container">
    <h1>Ideation Game</h1>
    <Link to="/summary">View Summary</Link>

    <div className="input-group">
      <label>Your Name</label>
      <input
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        placeholder="Enter your name"
      />
    </div>


    <div className="content-grid">
      {/* Left Column: Idea Tree */}
      <div className="idea-tree">
        <h2>Idea Tree</h2>
        {renderTree()}
      </div>

      {/* Middle Column: Form */}
      <div className="idea-form">
        <h2>Add a New Idea</h2>

        <div className="mb-4 space-y-2">
          <Label>Select Group ID</Label>
          <Input
            type="number"
            value={groupId || ''}
            onChange={e => setGroupId(Number(e.target.value))}
            placeholder="Enter a group ID"
          />
        </div>

        {/*<div className="newGroupButton">
          <Button onClick={createGroup}>Create New Group</Button>
        </div>*/}

        <button onClick={createGroup}>Create New Group</button>

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

        <button onClick={submitIdea}>Submit Idea</button>
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
