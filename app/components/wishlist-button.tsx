"use client";

import { useState } from "react";

type Props = {
  productId: string;
  canUse: boolean;
};

export default function WishlistButton({ productId, canUse }: Props) {
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("Wishlist");

  async function onToggle() {
    if (!canUse || loading) {
      return;
    }

    setLoading(true);
    const res = await fetch("/api/wishlist/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    if (res.ok) {
      const body = (await res.json()) as { wished?: boolean };
      setLabel(body.wished ? "Wished" : "Wishlist");
    }
    setLoading(false);
  }

  if (!canUse) {
    return <button disabled>Login for wishlist</button>;
  }

  return (
    <button type="button" onClick={onToggle} disabled={loading}>
      {loading ? "Saving..." : label}
    </button>
  );
}
