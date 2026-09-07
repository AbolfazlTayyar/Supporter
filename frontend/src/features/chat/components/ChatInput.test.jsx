import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatInput } from "./ChatInput";

describe("ChatInput", () => {
  it("disables the send button until there's non-whitespace input", async () => {
    const user = userEvent.setup();
    render(<ChatInput loading={false} onSend={vi.fn()} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Type a message..."), "   ");
    expect(button).toBeDisabled();

    await user.type(screen.getByPlaceholderText("Type a message..."), "hi");
    expect(button).toBeEnabled();
  });

  it("sends the typed message and clears the input on button click", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput loading={false} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.type(textarea, "hello there");
    await user.click(screen.getByRole("button"));

    expect(onSend).toHaveBeenCalledWith("hello there");
    expect(textarea).toHaveValue("");
  });

  it("sends on Enter and inserts a newline on Shift+Enter", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput loading={false} onSend={onSend} />);

    const textarea = screen.getByPlaceholderText("Type a message...");
    await user.type(textarea, "line one{Shift>}{Enter}{/Shift}line two{Enter}");

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith("line one\nline two");
  });

  it("does not send while loading", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<ChatInput loading={true} onSend={onSend} />);

    await user.type(screen.getByPlaceholderText("Type a message..."), "hello{Enter}");

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
