import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./EmptyState";

describe("EmptyState", () => {
  it("shows a prompt for the user to ask something", () => {
    render(<EmptyState />);
    expect(screen.getByText(/ask me anything/i)).toBeInTheDocument();
  });
});
