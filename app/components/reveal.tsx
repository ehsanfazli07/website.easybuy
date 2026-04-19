"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "fade-up" | "slide-up" | "zoom";
};

const delayClassMap: Record<number, string> = {
  40: "reveal-delay-40",
  180: "reveal-delay-180",
  240: "reveal-delay-240",
  280: "reveal-delay-280",
};

export default function Reveal({ children, className = "", delay = 0, variant = "fade-up" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const delayClass = delayClassMap[delay] || "";

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal reveal--${variant} ${delayClass} ${visible ? "visible" : ""} ${className}`.trim()}
    >
      {children}
    </div>
  );
}
