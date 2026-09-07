import "./App.css";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ChatWindow } from "./features/chat/components/ChatWindow";

export default function App() {
  return (
    <ErrorBoundary>
      <ChatWindow />
    </ErrorBoundary>
  );
}
