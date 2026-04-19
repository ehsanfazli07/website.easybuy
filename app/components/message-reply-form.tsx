"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  recipientId: string;
  sellerId: string;
};

export default function MessageReplyForm({ recipientId, sellerId }: Props) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim()) {
      setStatus("Write a reply first.");
      return;
    }

    setLoading(true);
    setStatus("");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId, sellerId, message: message.trim() }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Reply failed." }));
      setStatus(body.error || "Reply failed.");
      return;
    }

    setMessage("");
    router.refresh();
  }

  return (
    <form className="seller-message-form seller-message-form--inline" onSubmit={handleSubmit}>
      <textarea
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Reply to this conversation"
      />
      <div className="seller-message-form-actions">
        {status ? <p className="muted">{status}</p> : <span />}
        <button type="submit" className="seller-primary-btn" disabled={loading}>
          {loading ? "Sending..." : "Send reply"}
        </button>
      </div>
    </form>
  );
}