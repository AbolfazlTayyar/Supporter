import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ModelDropdown } from "./ModelDropdown";

const models = [
  { id: "openai/gpt-oss-20b", label: "GPT OSS 20B" },
  { id: "qwen/qwen3-32b", label: "Qwen 3 32B" },
];

describe("ModelDropdown", () => {
  it("renders nothing when there are no models yet", () => {
    const { container } = render(
      <ModelDropdown models={[]} selectedModel="" onSelect={vi.fn()} disabled={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the currently selected model's label", () => {
    render(<ModelDropdown models={models} selectedModel="qwen/qwen3-32b" onSelect={vi.fn()} disabled={false} />);
    expect(screen.getByText("Qwen 3 32B")).toBeInTheDocument();
  });

  it("opens the option list on click and selects a model", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <ModelDropdown models={models} selectedModel="openai/gpt-oss-20b" onSelect={onSelect} disabled={false} />
    );

    expect(screen.queryByText("Qwen 3 32B", { selector: ".model-dropdown-option span" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /gpt oss 20b/i }));
    await user.click(screen.getByRole("button", { name: /qwen 3 32b/i }));

    expect(onSelect).toHaveBeenCalledWith("qwen/qwen3-32b");
  });

  it("closes the list after selecting an option", async () => {
    const user = userEvent.setup();
    render(<ModelDropdown models={models} selectedModel="openai/gpt-oss-20b" onSelect={vi.fn()} disabled={false} />);

    await user.click(screen.getByRole("button", { name: /gpt oss 20b/i }));
    await user.click(screen.getByRole("button", { name: /qwen 3 32b/i }));

    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("closes the list on outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ModelDropdown models={models} selectedModel="openai/gpt-oss-20b" onSelect={vi.fn()} disabled={false} />
        <button>outside</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: /gpt oss 20b/i }));
    expect(screen.getAllByRole("listitem").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "outside" }));
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  it("is disabled and shows the fallback tooltip when models are unavailable", () => {
    render(<ModelDropdown models={models} selectedModel="openai/gpt-oss-20b" onSelect={vi.fn()} disabled={true} />);

    const trigger = screen.getByRole("button", { name: /gpt oss 20b/i });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("title", expect.stringMatching(/couldn't load the model list/i));
  });
});
