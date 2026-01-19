import { useEffect, useState } from "react";

const HOST_OVERRIDES = {
  "backoffice.celesty.com": "celesty",
  "backoffice.dreamtrips.com": "dreamtrips",
  "office.aregobrands.com": "arego",
};

function parseSubdomain(hostname) {
  if (HOST_OVERRIDES[hostname]) return HOST_OVERRIDES[hostname];

  const parts = hostname.split(".");
  // e.g. portal.example.com => ["portal","example","com"] => "portal"
  if (parts.length > 2) return parts[0];

  return null;
}

export default function useSubdomain() {
  const [subdomain, setSubdomain] = useState(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    const d = parseSubdomain(hostname);

    // Cache per-host (your current approach)
    sessionStorage.setItem(hostname, d ?? "");

    setSubdomain(d);
  }, []);

  return { subdomain };
}
