import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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


  const renderTree = (parentId = null, level = 0) => {
    return ideas
      .filter(idea => idea.parent_id === parentId)
      .map(idea => (
        <div key={idea.id} className={`ml-${level * 4} mb-2`}>
          <Card>
            <CardContent>
              <p>{idea.content}</p>
              <Button size="sm" onClick={() => setParentId(idea.id)}>
                Build on this idea
              </Button>
            </CardContent>
          </Card>
          {renderTree(idea.id, level + 1)}
        </div>
      ));
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
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ideation Game</h1>

      <div className="mb-4 space-y-2">
        <Label>Select Group ID</Label>
        <Input
          type="number"
          value={groupId || ''}
          onChange={e => setGroupId(Number(e.target.value))}
          placeholder="Enter a group ID"
        />

        <Button onClick={createGroup}>Create New Group</Button>
      </div>

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

      <div>
        <h2 className="text-xl font-semibold mb-2">Idea Tree</h2>
        {renderTree()}
      </div>
    </div>
  );
}
