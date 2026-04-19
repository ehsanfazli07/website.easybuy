"use client";

import { FormEvent, useState } from "react";

type Props = {
  creatorName: string;
  creatorPhone: string;
  creatorAbout: string;
  paypalReceiverEmail: string;
  paypalHostedButtonId: string;
  paypalHostedAction: string;
  websiteUrl: string;
  easybuyFacebookUrl: string;
  creatorInstagramUrl: string;
  creatorFacebookUrl: string;
  links: string[];
};

export default function AdminSiteContentForm({
  creatorName,
  creatorPhone,
  creatorAbout,
  paypalReceiverEmail,
  paypalHostedButtonId,
  paypalHostedAction,
  websiteUrl,
  easybuyFacebookUrl,
  creatorInstagramUrl,
  creatorFacebookUrl,
  links,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextLinks = String(formData.get("links") || "")
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    setSaving(true);
    setMessage("");

    const res = await fetch("/api/admin/site-content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creatorName: String(formData.get("creatorName") || ""),
        creatorPhone: String(formData.get("creatorPhone") || ""),
        creatorAbout: String(formData.get("creatorAbout") || ""),
        paypalReceiverEmail: String(formData.get("paypalReceiverEmail") || ""),
        paypalHostedButtonId: String(formData.get("paypalHostedButtonId") || ""),
        paypalHostedAction: String(formData.get("paypalHostedAction") || ""),
        websiteUrl: String(formData.get("websiteUrl") || ""),
        easybuyFacebookUrl: String(formData.get("easybuyFacebookUrl") || ""),
        creatorInstagramUrl: String(formData.get("creatorInstagramUrl") || ""),
        creatorFacebookUrl: String(formData.get("creatorFacebookUrl") || ""),
        links: nextLinks,
      }),
    });

    setMessage(res.ok ? "Updated." : "Update failed.");
    setSaving(false);
  }

  return (
    <form onSubmit={onSubmit} className="panel">
      <h3>Creator Section</h3>
      <div className="search-row">
        <input name="creatorName" defaultValue={creatorName} placeholder="Creator name" required />
        <input name="creatorPhone" defaultValue={creatorPhone} placeholder="Phone" required />
      </div>
      <textarea
        name="creatorAbout"
        defaultValue={creatorAbout}
        rows={4}
        placeholder="Short bio / about creator"
        required
      />
      <input
        type="email"
        name="paypalReceiverEmail"
        defaultValue={paypalReceiverEmail}
        placeholder="PayPal receiver email"
        required
      />
      <input
        name="paypalHostedButtonId"
        defaultValue={paypalHostedButtonId}
        placeholder="PayPal hosted_button_id"
        required
      />
      <input
        name="paypalHostedAction"
        defaultValue={paypalHostedAction}
        placeholder="PayPal form action URL"
        required
      />
      <input
        name="websiteUrl"
        defaultValue={websiteUrl}
        placeholder="Website URL"
      />
      <input
        name="easybuyFacebookUrl"
        defaultValue={easybuyFacebookUrl}
        placeholder="EasyBuy Facebook URL"
      />
      <input
        name="creatorInstagramUrl"
        defaultValue={creatorInstagramUrl}
        placeholder="Creator Instagram URL"
      />
      <input
        name="creatorFacebookUrl"
        defaultValue={creatorFacebookUrl}
        placeholder="Creator Facebook URL"
      />
      <textarea
        name="links"
        defaultValue={links.join("\n")}
        rows={4}
        placeholder="One URL per line"
      />
      <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
      {message ? <p className="muted">{message}</p> : null}
    </form>
  );
}
