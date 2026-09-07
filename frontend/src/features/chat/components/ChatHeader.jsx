import { ModelDropdown } from "./ModelDropdown";

export function ChatHeader({ models, selectedModel, onSelectModel, modelsUnavailable }) {
  return (
    <div className="chat-header">
      <div className="avatar">🤖</div>
      <div className="header-text">
        <div className="title">Mini AI Support Agent</div>
        <div className="subtitle">
          <span className="status-dot" />
          Online
        </div>
      </div>
      <ModelDropdown
        models={models}
        selectedModel={selectedModel}
        onSelect={onSelectModel}
        disabled={modelsUnavailable}
      />
    </div>
  );
}
