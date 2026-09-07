import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useAutoResizeTextarea } from "./useAutoResizeTextarea";

// jsdom doesn't run real layout, so scrollHeight is always 0. Stubbing it per
// render is the only way to observe the hook growing the textarea to fit
// content - this stands in for the browser's real layout engine, not for
// application logic.
function TestTextarea({ scrollHeight }) {
  const [value, setValue] = useState("");
  const ref = useAutoResizeTextarea(value);

  return (
    <textarea
      ref={(el) => {
        ref.current = el;
        if (el) Object.defineProperty(el, "scrollHeight", { configurable: true, value: scrollHeight(value) });
      }}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

describe("useAutoResizeTextarea", () => {
  it("grows the textarea's height to fit typed content", async () => {
    const user = userEvent.setup();
    const scrollHeight = (value) => 20 + value.length * 5;
    render(<TestTextarea scrollHeight={scrollHeight} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "hello world");

    expect(textarea.style.height).toBe(`${scrollHeight("hello world")}px`);
  });

  it("shrinks back down when the content is cleared", async () => {
    const user = userEvent.setup();
    const scrollHeight = (value) => (value ? 80 : 20);
    render(<TestTextarea scrollHeight={scrollHeight} />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "some text");
    expect(textarea.style.height).toBe("80px");

    await user.clear(textarea);
    expect(textarea.style.height).toBe("20px");
  });
});
