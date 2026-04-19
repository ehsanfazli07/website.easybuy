"use client";

import { FormEvent, useState } from "react";

type Props = {
  productId: string;
  canUse: boolean;
};

export default function ReviewForm({ productId, canUse }: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canUse || saving) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const rating = Number(formData.get("rating") || 5);
    const comment = String(formData.get("comment") || "").trim();

    setSaving(true);
    setMessage("");

    const res = await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });

    setMessage(res.ok ? "Review submitted." : "Could not submit review.");
    setSaving(false);
    event.currentTarget.reset();
  }

  if (!canUse) {
    return null;
  }

  return (
    <form onSubmit={submitReview} className="review-mini-form">
      <div className="search-row">
        <select name="rating" aria-label="Rating" defaultValue="5">
          <option value="5">5</option>
          <option value="4">4</option>
          <option value="3">3</option>
          <option value="2">2</option>
          <option value="1">1</option>
        </select>
        <input name="comment" required minLength={3} placeholder="Write a quick review" />
        <button type="submit" disabled={saving}>{saving ? "..." : "Rate"}</button>
      </div>
      {message ? <p className="muted">{message}</p> : null}
    </form>
  );
}
