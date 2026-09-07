import openaiIcon from "../icons/openai.svg";
import qwenIcon from "../icons/qwen.svg";
import genericModelIcon from "../icons/generic.svg";

// Official brand logos (from the simple-icons project) keyed by the model id's
// provider prefix, e.g. "openai/gpt-oss-20b" -> "openai". Providers with no
// logo in that catalog (Groq, Allam) fall back to a generic icon.
const PROVIDER_ICONS = {
  openai: openaiIcon,
  qwen: qwenIcon,
};

export function getModelIcon(modelId) {
  const provider = modelId.split("/")[0];
  return PROVIDER_ICONS[provider] || genericModelIcon;
}
