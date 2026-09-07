import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MessageBubble } from "./MessageBubble";

describe("MessageBubble", () => {
  it("renders the message text", () => {
    render(<MessageBubble role="user" text="Hello there" />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("shows a person avatar for a user message", () => {
    render(<MessageBubble role="user" text="Hi" />);
    expect(screen.getByText("🧑")).toBeInTheDocument();
  });

  it("shows a robot avatar for an assistant message", () => {
    render(<MessageBubble role="assistant" text="Hi" />);
    expect(screen.getByText("🤖")).toBeInTheDocument();
  });
});
