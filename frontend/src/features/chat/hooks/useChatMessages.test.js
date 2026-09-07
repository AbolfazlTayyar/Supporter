import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useChatMessages } from "./useChatMessages";
import { ApiError } from "../api/chatApi";
import * as chatApi from "../api/chatApi";

vi.mock("../api/chatApi", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, sendChatMessage: vi.fn() };
});

describe("useChatMessages", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with no messages and not loading", () => {
    const { result } = renderHook(() => useChatMessages());
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("appends the user message immediately, then the assistant's reply", async () => {
    let resolveSend;
    chatApi.sendChatMessage.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSend = resolve;
      })
    );

    const { result } = renderHook(() => useChatMessages());

    act(() => {
      result.current.sendMessage("hello there", "model-a");
    });

    expect(result.current.messages).toEqual([{ role: "user", text: "hello there" }]);
    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveSend({ reply: "Hi! How can I help?" });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.messages).toEqual([
      { role: "user", text: "hello there" },
      { role: "assistant", text: "Hi! How can I help?" },
    ]);
  });

  it("trims the message and ignores blank input", async () => {
    const { result } = renderHook(() => useChatMessages());

    await act(async () => {
      await result.current.sendMessage("   ", "model-a");
    });

    expect(result.current.messages).toEqual([]);
    expect(chatApi.sendChatMessage).not.toHaveBeenCalled();
  });

  it("ignores a new send while one is already in flight", async () => {
    let resolveSend;
    chatApi.sendChatMessage.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSend = resolve;
      })
    );

    const { result } = renderHook(() => useChatMessages());

    act(() => {
      result.current.sendMessage("first", "model-a");
    });
    act(() => {
      result.current.sendMessage("second", "model-a");
    });

    expect(chatApi.sendChatMessage).toHaveBeenCalledTimes(1);

    await act(async () => resolveSend({ reply: "ok" }));
  });

  it("shows the backend's own message for an ApiError", async () => {
    chatApi.sendChatMessage.mockRejectedValueOnce(new ApiError("Unknown model id.", 400));

    const { result } = renderHook(() => useChatMessages());

    await act(async () => {
      await result.current.sendMessage("hello", "bad-model");
    });

    expect(result.current.messages).toEqual([
      { role: "user", text: "hello" },
      { role: "assistant", text: "Unknown model id." },
    ]);
  });

  it("shows a generic unreachable message for a non-ApiError failure", async () => {
    chatApi.sendChatMessage.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useChatMessages());

    await act(async () => {
      await result.current.sendMessage("hello", "model-a");
    });

    expect(result.current.messages).toEqual([
      { role: "user", text: "hello" },
      { role: "assistant", text: "Error reaching the backend. Is it running on port 8000?" },
    ]);
  });
});
