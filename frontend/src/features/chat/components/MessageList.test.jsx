import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MessageList } from "./MessageList";

describe("MessageList", () => {
  beforeEach(() => {
    // jsdom has no scrollIntoView implementation.
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("shows the empty state when there are no messages", () => {
    render(<MessageList messages={[]} loading={false} />);
    expect(screen.getByText(/ask me anything/i)).toBeInTheDocument();
  });

  it("renders each message and hides the empty state once there are messages", () => {
    render(
      <MessageList
        messages={[
          { role: "user", text: "What's your return policy?" },
          { role: "assistant", text: "You can return items within 30 days." },
        ]}
        loading={false}
      />
    );

    expect(screen.getByText("What's your return policy?")).toBeInTheDocument();
    expect(screen.getByText("You can return items within 30 days.")).toBeInTheDocument();
    expect(screen.queryByText(/ask me anything/i)).not.toBeInTheDocument();
  });

  it("shows a typing indicator while loading", () => {
    const { container } = render(<MessageList messages={[]} loading={true} />);
    expect(container.querySelector(".typing-dots")).toBeInTheDocument();
  });

  it("does not show a typing indicator when not loading", () => {
    const { container } = render(<MessageList messages={[]} loading={false} />);
    expect(container.querySelector(".typing-dots")).not.toBeInTheDocument();
  });
});
