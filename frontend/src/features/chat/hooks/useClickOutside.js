import { useEffect, useRef } from "react";

// Calls `handler` on any mousedown outside the element `ref` points to, while
// `enabled` is true. `handler` is read via a ref so the listener doesn't need
// to be torn down and re-added every time the caller passes a new closure.
export function useClickOutside(ref, handler, enabled = true) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        handlerRef.current(e);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, enabled]);
}
