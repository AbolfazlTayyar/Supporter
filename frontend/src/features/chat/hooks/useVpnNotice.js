import { useEffect, useState } from "react";

// Set once the user has dismissed the VPN notice, so it only shows on their
// very first visit and not on every page refresh.
const VPN_NOTICE_SEEN_KEY = "supportAgent.vpnNoticeSeen";

export function useVpnNotice() {
  const [showVpnNotice, setShowVpnNotice] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(VPN_NOTICE_SEEN_KEY)) {
      setShowVpnNotice(true);
    }
  }, []);

  function dismissVpnNotice() {
    localStorage.setItem(VPN_NOTICE_SEEN_KEY, "true");
    setShowVpnNotice(false);
  }

  return { showVpnNotice, dismissVpnNotice };
}
