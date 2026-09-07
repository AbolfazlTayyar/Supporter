import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchModels, sendChatMessage } from "./chatApi";

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  };
}

describe("chatApi", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchModels", () => {
    it("resolves with the parsed model list on success", async () => {
      const data = { models: [{ id: "openai/gpt-oss-20b", label: "Default" }], default: "openai/gpt-oss-20b" };
      global.fetch.mockResolvedValueOnce(jsonResponse(data));

      await expect(fetchModels()).resolves.toEqual(data);
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/api/v1/models");
    });

    it("throws an ApiError carrying the backend's message on a non-2xx response", async () => {
      global.fetch.mockResolvedValueOnce(
        jsonResponse({ error: { message: "Upstream model service is unavailable." } }, { ok: false, status: 502 })
      );

      await expect(fetchModels()).rejects.toMatchObject({
        name: "ApiError",
        message: "Upstream model service is unavailable.",
        status: 502,
      });
    });

    it("falls back to a generic message when the error body isn't valid JSON", async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("not json")),
      });

      await expect(fetchModels()).rejects.toMatchObject({
        message: "Something went wrong. Please try again.",
        status: 500,
      });
    });

    it("rejects with the underlying error when the network call itself fails", async () => {
      global.fetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

      await expect(fetchModels()).rejects.toBeInstanceOf(TypeError);
    });
  });

  describe("sendChatMessage", () => {
    it("posts the message and model, and resolves with the reply", async () => {
      global.fetch.mockResolvedValueOnce(jsonResponse({ reply: "Hi there!" }));

      await expect(sendChatMessage("hello", "openai/gpt-oss-20b")).resolves.toEqual({ reply: "Hi there!" });
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "hello", model: "openai/gpt-oss-20b" }),
      });
    });

    it("omits the model field when no model is given", async () => {
      global.fetch.mockResolvedValueOnce(jsonResponse({ reply: "Hi there!" }));

      await sendChatMessage("hello", undefined);

      const [, init] = global.fetch.mock.calls[0];
      expect(JSON.parse(init.body)).toEqual({ message: "hello", model: undefined });
    });

    it("throws an ApiError for an unknown model id (400)", async () => {
      global.fetch.mockResolvedValueOnce(
        jsonResponse({ error: { message: "Unknown model id." } }, { ok: false, status: 400 })
      );

      await expect(sendChatMessage("hello", "not-a-real-model")).rejects.toBeInstanceOf(ApiError);
    });
  });
});
