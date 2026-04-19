"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  productId: string;
  canBuy: boolean;
};

export default function PurchaseButton({ productId, canBuy }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleBuy() {
    if (!canBuy) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, quantity: 1 }),
    });
    setLoading(false);

    if (res.ok) {
      router.push("/cart");
      return;
    }

    alert("Could not add to cart. Please try again.");
  }

  return (
    <button
      type="button"
      onClick={handleBuy}
      disabled={loading}
      className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
    >
      {loading ? "Adding..." : canBuy ? "Add to cart" : "Login to buy"}
    </button>
  );
}
