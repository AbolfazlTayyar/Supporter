import { useEffect, useState } from "react";
import { fetchModels } from "../api/chatApi";

// Mirrors the backend's own cache TTL (see get_available_models in agent.py) -
// no point re-fetching from us more often than we'd re-fetch from Groq.
const MODELS_CACHE_KEY = "supportAgent.models";
const MODELS_CACHE_TTL_MS = 60 * 60 * 1000;

// Shown when we can't reach the backend's /models endpoint at all, so the user
// can still chat - it just mirrors the backend's own hardcoded default model.
const FALLBACK_MODEL = { id: "openai/gpt-oss-20b", label: "Default model" };

// Fetches the list of models the backend can talk to and preselects its
// default, caching in localStorage so reloading the page doesn't re-fetch
// every time.
export function useModels() {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [modelsUnavailable, setModelsUnavailable] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem(MODELS_CACHE_KEY);
    if (cached) {
      try {
        const { models: cachedModels, default: cachedDefault, fetchedAt } = JSON.parse(cached);
        if (Date.now() - fetchedAt < MODELS_CACHE_TTL_MS) {
          setModels(cachedModels);
          setSelectedModel(cachedDefault);
          return;
        }
      } catch {
        // Corrupt cache entry - fall through and re-fetch.
      }
    }

    fetchModels()
      .then((data) => {
        setModels(data.models);
        setSelectedModel(data.default);
        localStorage.setItem(
          MODELS_CACHE_KEY,
          JSON.stringify({ models: data.models, default: data.default, fetchedAt: Date.now() })
        );
      })
      .catch(() => {
        // Backend unreachable (or /models errored) - let the user keep chatting
        // with the default model instead of leaving them stuck with no selector.
        setModels([FALLBACK_MODEL]);
        setSelectedModel(FALLBACK_MODEL.id);
        setModelsUnavailable(true);
      });
  }, []);

  return { models, selectedModel, setSelectedModel, modelsUnavailable };
}
