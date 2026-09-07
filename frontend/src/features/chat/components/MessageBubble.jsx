export function MessageBubble({ role, text }) {
  return (
    <div className={`message-row ${role}`}>
      <div className="message-avatar">{role === "user" ? "🧑" : "🤖"}</div>
      <div className="bubble">{text}</div>
    </div>
  );
}
