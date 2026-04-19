"use client";

import { useEffect, useState } from "react";

export default function SiteEntryAnimation() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 560);

    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="site-entry-overlay" aria-hidden="true">
      <div className="site-entry-ring" />
      <span className="site-entry-text">EasyBuy</span>
    </div>
  );
}
