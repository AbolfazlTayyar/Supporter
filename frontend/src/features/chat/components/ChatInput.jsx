import { useState } from "react";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea";

export function ChatInput({ loading, onSend }) {
  const [input, setInput] = useState("");
  const textareaRef = useAutoResizeTextarea(input);

  function handleSend() {
    if (!input.trim() || loading) return;
    onSend(input);
    setInput("");
  }

  function handleKeyDown(e) {
    // Enter sends, Shift+Enter inserts a newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chat-input-bar">
      <textarea
        ref={textareaRef}
        rows={1}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
      />
      <button className="send-button" onClick={handleSend} disabled={loading || !input.trim()}>
        ➤
      </button>
    </div>
  );
}
