import { useEffect, useRef } from "react";

// Grows a textarea to fit its content (up to the CSS max-height, where it
// starts scrolling instead) whenever `value` changes - including back down
// to one row when `value` is cleared.
export function useAutoResizeTextarea(value) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return textareaRef;
}
