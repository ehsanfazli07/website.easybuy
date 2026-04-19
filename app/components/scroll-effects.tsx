"use client";

import { useEffect } from "react";

export default function ScrollEffects() {
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const root = document.documentElement;
    let rafId = 0;

    const update = () => {
      const maxScroll = Math.max(document.body.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(window.scrollY / maxScroll, 1);
      const parallax = Math.min(window.scrollY * 0.08, 120);

      root.style.setProperty("--scroll-progress", progress.toFixed(4));
      root.style.setProperty("--parallax-y", `${parallax.toFixed(2)}px`);
      rafId = 0;
    };

    const onScroll = () => {
      if (rafId) {
        return;
      }
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return <div className="scroll-progress" aria-hidden="true" />;
}
