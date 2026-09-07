export function TypingIndicator() {
  return (
    <div className="message-row assistant">
      <div className="message-avatar">🤖</div>
      <div className="bubble">
        <span className="typing-dots">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}
