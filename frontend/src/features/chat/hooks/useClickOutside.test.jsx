import { useRef, useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { useClickOutside } from "./useClickOutside";

function TestMenu({ enabled = true }) {
  const [open, setOpen] = useState(true);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), enabled);

  return (
    <div>
      <div ref={ref} data-testid="menu">
        {open ? "menu open" : "menu closed"}
      </div>
      <button>outside button</button>
    </div>
  );
}

describe("useClickOutside", () => {
  it("closes the menu when clicking outside it", async () => {
    const user = userEvent.setup();
    render(<TestMenu />);

    expect(screen.getByTestId("menu")).toHaveTextContent("menu open");

    await user.click(screen.getByRole("button", { name: "outside button" }));

    expect(screen.getByTestId("menu")).toHaveTextContent("menu closed");
  });

  it("stays open when clicking inside it", async () => {
    const user = userEvent.setup();
    render(<TestMenu />);

    await user.click(screen.getByTestId("menu"));

    expect(screen.getByTestId("menu")).toHaveTextContent("menu open");
  });

  it("does nothing when disabled", async () => {
    const user = userEvent.setup();
    render(<TestMenu enabled={false} />);

    await user.click(screen.getByRole("button", { name: "outside button" }));

    expect(screen.getByTestId("menu")).toHaveTextContent("menu open");
  });
});
