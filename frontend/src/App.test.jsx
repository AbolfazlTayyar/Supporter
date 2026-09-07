import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import * as chatApi from "./features/chat/api/chatApi";

vi.mock("./features/chat/api/chatApi", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchModels: vi.fn(), sendChatMessage: vi.fn() };
});

describe("App", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    localStorage.setItem("supportAgent.vpnNoticeSeen", "true");
    chatApi.fetchModels.mockResolvedValue({
      models: [{ id: "openai/gpt-oss-20b", label: "GPT OSS 20B" }],
      default: "openai/gpt-oss-20b",
    });
  });

  it("renders the chat assistant inside the error boundary", async () => {
    render(<App />);

    expect(screen.getByText("Mini AI Support Agent")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("GPT OSS 20B")).toBeInTheDocument());
  });
});
