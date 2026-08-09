import React, { useState } from "react";
import { useUniversalCopy } from '../hooks/useCopy.js';

export default function CopyExample({text}) {
  const copy = useUniversalCopy();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copy(text);
    setCopied(ok);

    // Auto-hide after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span style={{paddingLeft:5}}>
      <svg onClick={handleCopy} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-copy">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M7 9.667a2.667 2.667 0 0 1 2.667 -2.667h8.666a2.667 2.667 0 0 1 2.667 2.667v8.666a2.667 2.667 0 0 1 -2.667 2.667h-8.666a2.667 2.667 0 0 1 -2.667 -2.667l0 -8.666" />
        <path d="M4.012 16.737a2.005 2.005 0 0 1 -1.012 -1.737v-10c0 -1.1 .9 -2 2 -2h10c.75 0 1.158 .385 1.5 1" />
      </svg>
      
      {copied && (
        <div style={{ marginTop: 10, color: "green" }}>
          Copied to clipboard
        </div>
      )}
    </span>
  );
}
