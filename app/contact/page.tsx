"use client";

import { FormEvent, useState } from "react";

import Reveal from "@/app/components/reveal";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSent(false);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      message: String(formData.get("message") || ""),
    };

    setSending(true);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setSending(false);

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Message not sent." }));
      setError(body.error || "Message not sent.");
      return;
    }

    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <main className="premium-page">
      <Reveal>
      <section className="premium-section contact-shell">
        <h1>Contact Us</h1>
        <p>Send your message and our team will reply to your email soon.</p>
        <p className="muted">Support: info@easybuystores.com</p>
        <form className="contact-form" onSubmit={onSubmit}>
          <input name="name" placeholder="Name" required />
          <input name="email" type="email" placeholder="Email" required />
          <textarea name="message" placeholder="Message" rows={5} required />
          <button type="submit" disabled={sending}>{sending ? "Sending..." : "Send Message"}</button>
          {sent ? <p className="muted">Message sent successfully.</p> : null}
          {error ? <p className="muted">{error}</p> : null}
        </form>
      </section>
      </Reveal>
    </main>
  );
}
