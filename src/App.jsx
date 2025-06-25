import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import './App.css';


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


  useEffect(() => {
    if (!groupId) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/ideas/group/${groupId}`)
      .then(res => res.json())
      .then(data => setIdeas(data))
      .catch(err => console.error("Failed to fetch group ideas:", err));
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
      body: JSON.stringify({ parentId, content: fullContent }),
    });

    setContent('');
    setPhrase('');
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
                  {idea.content}
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

    <div className="content-grid">
      {/* Left Column: Idea Tree */}
      <div className="idea-tree">
        <h2>Idea Tree</h2>
        {renderTree()}
      </div>

      {/* Right Column: Form */}
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
    </div>
  </div>

  );
}
