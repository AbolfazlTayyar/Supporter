import { useEffect, useRef } from "react";
import { EmptyState } from "./EmptyState";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";

export function MessageList({ messages, loading }) {
  const messagesEndRef = useRef(null);

  // Keep the latest message in view as new ones arrive.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="chat-messages">
      {messages.length === 0 && <EmptyState />}

      {messages.map((m, i) => (
        <MessageBubble key={i} role={m.role} text={m.text} />
      ))}

      {loading && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}
