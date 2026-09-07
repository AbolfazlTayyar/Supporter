import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useVpnNotice } from "./useVpnNotice";

describe("useVpnNotice", () => {
  it("shows the notice on a first visit with no stored dismissal", () => {
    const { result } = renderHook(() => useVpnNotice());
    expect(result.current.showVpnNotice).toBe(true);
  });

  it("does not show the notice once it was previously dismissed", () => {
    localStorage.setItem("supportAgent.vpnNoticeSeen", "true");

    const { result } = renderHook(() => useVpnNotice());
    expect(result.current.showVpnNotice).toBe(false);
  });

  it("hides the notice and persists the dismissal when dismissed", () => {
    const { result } = renderHook(() => useVpnNotice());
    expect(result.current.showVpnNotice).toBe(true);

    act(() => result.current.dismissVpnNotice());

    expect(result.current.showVpnNotice).toBe(false);
    expect(localStorage.getItem("supportAgent.vpnNoticeSeen")).toBe("true");
  });
});
