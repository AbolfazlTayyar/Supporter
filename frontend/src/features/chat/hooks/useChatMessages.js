import { useState } from "react";
import { ApiError, sendChatMessage } from "../api/chatApi";

// Owns the message list and talks to the backend's /chat endpoint.
export function useChatMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  async function sendMessage(text, model) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setLoading(true);

    try {
      const data = await sendChatMessage(trimmed, model);
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch (err) {
      // ApiError carries the backend's own client-safe message (e.g. an
      // unknown model id); anything else means the backend was unreachable.
      const text =
        err instanceof ApiError
          ? err.message
          : "Error reaching the backend. Is it running on port 8000?";
      setMessages((prev) => [...prev, { role: "assistant", text }]);
    } finally {
      setLoading(false);
    }
  }

  return { messages, loading, sendMessage };
}
