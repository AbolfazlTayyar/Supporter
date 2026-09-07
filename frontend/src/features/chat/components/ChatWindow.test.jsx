import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatWindow } from "./ChatWindow";
import * as chatApi from "../api/chatApi";
import { ApiError } from "../api/chatApi";

vi.mock("../api/chatApi", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchModels: vi.fn(), sendChatMessage: vi.fn() };
});

describe("ChatWindow", () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    localStorage.setItem("supportAgent.vpnNoticeSeen", "true");
    chatApi.fetchModels.mockResolvedValue({
      models: [{ id: "openai/gpt-oss-20b", label: "GPT OSS 20B" }],
      default: "openai/gpt-oss-20b",
    });
  });

  it("lets a user send a message and see the assistant's reply", async () => {
    const user = userEvent.setup();
    chatApi.sendChatMessage.mockResolvedValueOnce({ reply: "You can return items within 30 days." });

    render(<ChatWindow />);

    await waitFor(() => expect(screen.getByText("GPT OSS 20B")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText("Type a message..."), "What's your return policy?{Enter}");

    expect(screen.getByText("What's your return policy?")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("You can return items within 30 days.")).toBeInTheDocument()
    );
    expect(chatApi.sendChatMessage).toHaveBeenCalledWith("What's your return policy?", "openai/gpt-oss-20b");
  });

  it("shows the VPN notice on a first visit and dismisses it", async () => {
    localStorage.removeItem("supportAgent.vpnNoticeSeen");
    const user = userEvent.setup();
    render(<ChatWindow />);

    expect(screen.getByText("VPN required")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(screen.queryByText("VPN required")).not.toBeInTheDocument();
  });

  it("shows the backend's error message when the chat call fails", async () => {
    const user = userEvent.setup();
    chatApi.sendChatMessage.mockRejectedValueOnce(new ApiError("Unknown model id.", 400));

    render(<ChatWindow />);
    await waitFor(() => expect(screen.getByText("GPT OSS 20B")).toBeInTheDocument());

    await user.type(screen.getByPlaceholderText("Type a message..."), "hello{Enter}");

    await waitFor(() => expect(screen.getByText("Unknown model id.")).toBeInTheDocument());
  });
});
