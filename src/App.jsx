// Boilerplate React App for the Ideation Game
// Backend assumed: Node.js + Express + SQL (e.g., PostgreSQL or SQLite)

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './components/ui/card.jsx';
import { Button } from './components/ui/button.jsx';
import { Input } from './components/ui/input.jsx';
import { Textarea } from './components/ui/textarea.jsx';
import { Label } from './components/ui/label.jsx';

// State variable for groupId
//const [groupId, setGroupId] = useState(null);


// List of conjunctive phrases for linking ideas
const conjunctivePhrases = [
  '',
  'More precisely,',
  'However,',
  'On the other hand,',
  'For example,',
];

export default function IdeationGame() {
  // State to hold all ideas
  const [ideas, setIdeas] = useState([]);
  // ID of the idea currently selected to build upon
  const [parentId, setParentId] = useState(null);
  // Content of the idea being entered
  const [content, setContent] = useState('');
  // Selected conjunctive phrase to start the idea
  const [phrase, setPhrase] = useState('');

  // Fetch existing ideas from backend API on component mount based on groupId
  useEffect(() => {
  if (!groupId) return;

  fetch(`${import.meta.env.VITE_API_URL}/api/ideas/group/${groupId}`)
    .then(res => res.json())
    .then(data => setIdeas(data))
    .catch(err => console.error("Failed to fetch group ideas:", err));
}, [groupId]);

  /* const createGroup = async () => {
  const name = prompt('Enter new group name:');
  if (!name) return;

  try {
    const newGroup = await fetch(`${import.meta.env.VITE_API_URL}/api/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    }).then(res => res.json());

    setGroupId(newGroup.id); // Set the active group to the newly created one
  } catch (err) {
    console.error('Failed to create group:', err);
    alert('Something went wrong while creating the group.');
  } 
  };
  */


  // Submit a new idea to the server
  const submitIdea = async () => {
    // Prepend conjunctive phrase if selected
    const fullContent = phrase ? `${phrase} ${content}` : content;

    // POST request to server with the new idea data
    await fetch(`${import.meta.env.VITE_API_URL}/api/ideas/group/${groupId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId, content: fullContent }),
    });

    
    // Reset input fields after submission
    setContent('');
    setPhrase('');
    setParentId(null);

    // Refresh ideas from the server to reflect the new submission
    const updated = await fetch(`${import.meta.env.VITE_API_URL}/api/ideas/group/${groupId}`)
      .then(res => res.json());
    setIdeas(updated);
  };

  // Recursive function to render ideas in a tree format
  const renderTree = (parentId = null, level = 0) => {
    return ideas
      // Filter ideas by parentId to build tree structure
      .filter(idea => idea.parent_id === parentId)
      .map(idea => (
        <div key={idea.id} style={{ marginLeft: `${level * 20}px`, marginBottom: '12px' }}>
          <Card>
            <CardContent>
              <p>idea #{idea.id}</p>
              <p>{idea.content}</p>
              {/* Button to allow building on this idea */}
              <Button size="sm" onClick={() => setParentId(idea.id)}>
                Build on this idea
              </Button>
            </CardContent>
          </Card>
          {/* Recursively render children of this idea */}
          {renderTree(idea.id, level + 1)}
        </div>
      ));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ideation Game</h1>
      <h2 className="text-2xl font-bold mb-4">Come up with an idea!</h2>

      {/*<Button className="mb-4" onClick={createGroup}>
        Create New Group
      </Button>*/}

      {/* Form to submit a new idea */}
      <div className="space-y-4 mb-6">
        <Label>Conjunctive Phrase</Label>
        <select
          value={phrase}
          onChange={e => setPhrase(e.target.value)}
          className="w-full border rounded p-2"
        >
          {conjunctivePhrases.map(p => (
            <option key={p} value={p}>{p || '[None]'}</option>
          ))}
        </select>

        <Label>Your Idea</Label>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Enter your idea..."
        />

        <Button onClick={submitIdea}>Submit Idea</Button>
      </div>

      {/* <div className="mb-4">
        <Label>Select Group ID</Label>
        <Input
          type="number"
          value={groupId || ''}
          onChange={e => setGroupId(Number(e.target.value))}
          placeholder="Enter a group ID..."
        />
      </div>
      */}

      {/* Render the idea tree */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Idea Tree</h2>
        {renderTree()}
      </div>
    </div>
  );
}
