import { useRef, useState } from "react";
import { getModelIcon } from "../utils/modelIcons";
import { useClickOutside } from "../hooks/useClickOutside";

export function ModelDropdown({ models, selectedModel, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the model picker when clicking anywhere outside it.
  useClickOutside(menuRef, () => setOpen(false), open);

  if (models.length === 0) return null;

  return (
    <div className="model-dropdown" ref={menuRef}>
      <button
        type="button"
        className="model-dropdown-trigger"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        title={
          disabled
            ? "Couldn't load the model list - continuing with the default model"
            : "Choose which model answers you"
        }
      >
        <img className="model-icon" src={getModelIcon(selectedModel)} alt="" />
        <span className="model-dropdown-label">
          {models.find((m) => m.id === selectedModel)?.label ?? selectedModel}
        </span>
        <span className="model-dropdown-caret">▾</span>
      </button>

      {open && (
        <ul className="model-dropdown-list">
          {models.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className={`model-dropdown-option${m.id === selectedModel ? " selected" : ""}`}
                onClick={() => {
                  onSelect(m.id);
                  setOpen(false);
                }}
              >
                <img className="model-icon" src={getModelIcon(m.id)} alt="" />
                <span>{m.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
