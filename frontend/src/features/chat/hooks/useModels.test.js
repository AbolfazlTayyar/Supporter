import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useModels } from "./useModels";
import * as chatApi from "../api/chatApi";

vi.mock("../api/chatApi");

const CACHE_KEY = "supportAgent.models";

describe("useModels", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches models and preselects the backend's default", async () => {
    chatApi.fetchModels.mockResolvedValueOnce({
      models: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
      default: "b",
    });

    const { result } = renderHook(() => useModels());

    await waitFor(() => expect(result.current.selectedModel).toBe("b"));
    expect(result.current.models).toEqual([{ id: "a", label: "A" }, { id: "b", label: "B" }]);
    expect(result.current.modelsUnavailable).toBe(false);
  });

  it("caches the fetched models in localStorage for reuse on remount", async () => {
    chatApi.fetchModels.mockResolvedValueOnce({
      models: [{ id: "a", label: "A" }],
      default: "a",
    });

    const { result, unmount } = renderHook(() => useModels());
    await waitFor(() => expect(result.current.selectedModel).toBe("a"));
    unmount();

    chatApi.fetchModels.mockClear();

    const { result: second } = renderHook(() => useModels());
    await waitFor(() => expect(second.current.selectedModel).toBe("a"));
    expect(chatApi.fetchModels).not.toHaveBeenCalled();
  });

  it("re-fetches when the cached entry has expired", async () => {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        models: [{ id: "stale", label: "Stale" }],
        default: "stale",
        fetchedAt: Date.now() - 61 * 60 * 1000,
      })
    );
    chatApi.fetchModels.mockResolvedValueOnce({
      models: [{ id: "fresh", label: "Fresh" }],
      default: "fresh",
    });

    const { result } = renderHook(() => useModels());

    await waitFor(() => expect(result.current.selectedModel).toBe("fresh"));
    expect(chatApi.fetchModels).toHaveBeenCalledTimes(1);
  });

  it("falls back to the default model when the backend is unreachable", async () => {
    chatApi.fetchModels.mockRejectedValueOnce(new Error("network error"));

    const { result } = renderHook(() => useModels());

    await waitFor(() => expect(result.current.modelsUnavailable).toBe(true));
    expect(result.current.models).toEqual([{ id: "openai/gpt-oss-20b", label: "Default model" }]);
    expect(result.current.selectedModel).toBe("openai/gpt-oss-20b");
  });

  it("lets the caller change the selected model", async () => {
    chatApi.fetchModels.mockResolvedValueOnce({
      models: [{ id: "a", label: "A" }, { id: "b", label: "B" }],
      default: "a",
    });

    const { result } = renderHook(() => useModels());
    await waitFor(() => expect(result.current.selectedModel).toBe("a"));

    act(() => result.current.setSelectedModel("b"));

    expect(result.current.selectedModel).toBe("b");
  });
});
