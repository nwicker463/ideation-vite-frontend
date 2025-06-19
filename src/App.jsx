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
  const [ideas, setIdeas] = useState([]);
  const [parentId, setParentId] = useState(null);
  const [content, setContent] = useState('');
  const [phrase, setPhrase] = useState('');

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/ideas`)
      .then(res => res.json())
      .then(data => setIdeas(data))
      .catch(err => console.error('Failed to fetch ideas:', err));
  }, []);

  const submitIdea = async () => {
    const fullContent = phrase ? `${phrase} ${content}` : content;

    await fetch(`${import.meta.env.VITE_API_URL}/api/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parentId, content: fullContent }),
    });

    setContent('');
    setPhrase('');
    setParentId(null);

    const updated = await fetch(`${import.meta.env.VITE_API_URL}/api/ideas`)
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

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Ideation Game</h1>

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
