export function VpnNoticeModal({ show, onDismiss }) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon">🌐</div>
        <div className="modal-title">VPN required</div>
        <div className="modal-body">
          This assistant is powered by Groq, which isn't accessible from every
          region. If your messages fail to send, please connect to a VPN and try
          again.
        </div>
        <button className="modal-button" onClick={onDismiss}>
          Got it
        </button>
      </div>
    </div>
  );
}
