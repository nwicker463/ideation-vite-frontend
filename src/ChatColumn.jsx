import { useState, useEffect } from "react";

export default function ChatColumn({ currentGroupId, currentUserId, currentUserLabel }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // Load chat messages when groupId changes
  useEffect(() => {
    if (!currentGroupId) return;
    loadMessages();
  }, [currentGroupId]);

  const loadMessages = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages/group/${currentGroupId}`
      );

      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error("Error loading chat:", err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const body = {
      userId: currentUserId,
      message: text,
      contributorLabel: currentUserLabel,
    };

    try {
      // Post to backend
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/messages/group/${currentGroupId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      );

      const newMsg = await res.json();

      // Add message locally without reloading
      setMessages((prev) => [...prev, newMsg]);
      setText("");

    } catch (err) {
      console.error("Failed to send chat message:", err);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      height: "100%" 
    }}>
      
      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "10px",
        background: "#f7f7f7",
        borderBottom: "1px solid #ddd"
      }}>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: "8px" }}>
            <strong>{m.contributor_label || "User"}:</strong> {m.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ display: "flex", padding: "10px" }}>
        <input
          style={{ flex: 1, marginRight: "8px", padding: "6px" }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
        />
        <button type="submit">Send</button>
      </form>

    </div>
  );
}
