"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  recipientId: string;
  sellerId: string;
  loggedIn: boolean;
  buttonLabel?: string;
  className?: string;
};

export default function SellerMessageButton({
  recipientId,
  sellerId,
  loggedIn,
  buttonLabel = "Message",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!loggedIn) {
      router.push("/login");
      return;
    }

    if (!message.trim()) {
      setStatus("Write a message first.");
      return;
    }

    setLoading(true);
    setStatus("");

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipientId,
        sellerId,
        message: message.trim(),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Message was not sent." }));
      setStatus(body.error || "Message was not sent.");
      return;
    }

    setMessage("");
    setOpen(false);
    router.push(`/messages?with=${recipientId}`);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className={["seller-secondary-btn", className].filter(Boolean).join(" ")}
        onClick={() => {
          if (!loggedIn) {
            router.push("/login");
            return;
          }

          setOpen(true);
        }}
      >
        {buttonLabel}
      </button>

      {open ? (
        <div className="seller-dialog-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="seller-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Send message"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="seller-dialog-head">
              <h3>Message seller</h3>
              <button type="button" className="seller-dialog-close" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <form className="seller-message-form" onSubmit={handleSubmit}>
              <textarea
                rows={6}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write your message to the seller"
              />
              {status ? <p className="muted">{status}</p> : null}
              <button type="submit" className="seller-primary-btn" disabled={loading}>
                {loading ? "Sending..." : "Send message"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}