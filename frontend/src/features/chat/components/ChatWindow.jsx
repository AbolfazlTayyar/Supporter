import { useModels } from "../hooks/useModels";
import { useChatMessages } from "../hooks/useChatMessages";
import { useVpnNotice } from "../hooks/useVpnNotice";
import { VpnNoticeModal } from "./VpnNoticeModal";
import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export function ChatWindow() {
  const { models, selectedModel, setSelectedModel, modelsUnavailable } = useModels();
  const { messages, loading, sendMessage } = useChatMessages();
  const { showVpnNotice, dismissVpnNotice } = useVpnNotice();

  return (
    <div className="app-shell">
      <VpnNoticeModal show={showVpnNotice} onDismiss={dismissVpnNotice} />

      <div className="chat-card">
        <ChatHeader
          models={models}
          selectedModel={selectedModel}
          onSelectModel={setSelectedModel}
          modelsUnavailable={modelsUnavailable}
        />

        <MessageList messages={messages} loading={loading} />

        <ChatInput loading={loading} onSend={(text) => sendMessage(text, selectedModel)} />
      </div>
    </div>
  );
}
