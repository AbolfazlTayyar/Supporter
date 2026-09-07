import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { VpnNoticeModal } from "./VpnNoticeModal";

describe("VpnNoticeModal", () => {
  it("renders nothing when show is false", () => {
    const { container } = render(<VpnNoticeModal show={false} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the VPN notice when show is true", () => {
    render(<VpnNoticeModal show={true} onDismiss={vi.fn()} />);
    expect(screen.getByText("VPN required")).toBeInTheDocument();
  });

  it("calls onDismiss when clicking the Got it button", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<VpnNoticeModal show={true} onDismiss={onDismiss} />);

    await user.click(screen.getByRole("button", { name: "Got it" }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("calls onDismiss when clicking the overlay", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<VpnNoticeModal show={true} onDismiss={onDismiss} />);

    await user.click(screen.getByText("VPN required").closest(".modal-overlay"));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not call onDismiss when clicking inside the card", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<VpnNoticeModal show={true} onDismiss={onDismiss} />);

    await user.click(screen.getByText("VPN required"));

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
