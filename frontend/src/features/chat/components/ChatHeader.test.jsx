import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChatHeader } from "./ChatHeader";

describe("ChatHeader", () => {
  it("shows the assistant's name and online status", () => {
    render(
      <ChatHeader models={[]} selectedModel="" onSelectModel={vi.fn()} modelsUnavailable={false} />
    );

    expect(screen.getByText("Mini AI Support Agent")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
  });

  it("renders the model dropdown when models are available", () => {
    render(
      <ChatHeader
        models={[{ id: "a", label: "Model A" }]}
        selectedModel="a"
        onSelectModel={vi.fn()}
        modelsUnavailable={false}
      />
    );

    expect(screen.getByText("Model A")).toBeInTheDocument();
  });
});
