"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { emptySellerSocialLinks } from "@/lib/seller-profile";

export default function SellPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profile, setProfile] = useState({
    storeName: "",
    bio: "",
    coverImageUrl: "",
    avatarUrl: "",
    social: emptySellerSocialLinks(),
  });
  const router = useRouter();

  useEffect(() => {
    async function loadProfile() {
      const res = await fetch("/api/sellers/me");
      if (!res.ok) {
        return;
      }

      const body = await res.json();
      setProfile({
        storeName: body.seller.storeName || body.seller.displayName || "",
        bio: body.seller.bio || "",
        coverImageUrl: body.seller.coverImageUrl || "",
        avatarUrl: body.seller.avatarUrl || "",
        social: body.seller.social,
      });
    }

    loadProfile().catch(() => undefined);
  }, []);

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      storeName: String(formData.get("storeName") || ""),
      bio: String(formData.get("bio") || ""),
      coverImageUrl: String(formData.get("coverImageUrl") || ""),
      avatarUrl: String(formData.get("avatarUrl") || ""),
      social: {
        instagram: String(formData.get("instagram") || ""),
        facebook: String(formData.get("facebook") || ""),
        tiktok: String(formData.get("tiktok") || ""),
        youtube: String(formData.get("youtube") || ""),
        telegram: String(formData.get("telegram") || ""),
        twitter: String(formData.get("twitter") || ""),
        whatsapp: String(formData.get("whatsapp") || ""),
      },
    };

    const res = await fetch("/api/sellers/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setProfileSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Storefront update failed." }));
      setProfileMessage(body.error || "Storefront update failed.");
      return;
    }

    const body = await res.json();
    setProfile({
      storeName: body.seller.storeName || body.seller.displayName || "",
      bio: body.seller.bio || "",
      coverImageUrl: body.seller.coverImageUrl || "",
      avatarUrl: body.seller.avatarUrl || "",
      social: body.seller.social,
    });
    setProfileMessage("Storefront updated.");
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      title: String(formData.get("title") || ""),
      description: String(formData.get("description") || ""),
      category: String(formData.get("category") || "General"),
      priceCents: Math.round(Number(formData.get("price") || 0) * 100),
      stock: Number(formData.get("stock") || 1),
      imageUrl: String(formData.get("imageUrl") || ""),
    };

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Failed to create product." }));
      setMessage(body.error || "Failed to create product.");
      return;
    }

    setMessage("Product created successfully.");
    router.push("/shop");
  }

  return (
    <main className="page-wrap seller-tools-page">
      <section className="panel seller-tools-panel">
        <h1>Seller Storefront</h1>
        <p>Manage your cover image, avatar, store bio, and dynamic social links.</p>
        <form className="auth-form seller-storefront-form" onSubmit={handleProfileSave}>
          <input
            name="storeName"
            placeholder="Store name"
            required
            minLength={2}
            value={profile.storeName}
            onChange={(event) => setProfile((current) => ({ ...current, storeName: event.target.value }))}
          />
          <textarea
            name="bio"
            placeholder="Short store description"
            required
            rows={4}
            minLength={10}
            value={profile.bio}
            onChange={(event) => setProfile((current) => ({ ...current, bio: event.target.value }))}
          />
          <input
            name="coverImageUrl"
            placeholder="Cover image URL"
            value={profile.coverImageUrl}
            onChange={(event) => setProfile((current) => ({ ...current, coverImageUrl: event.target.value }))}
          />
          <input
            name="avatarUrl"
            placeholder="Avatar image URL"
            value={profile.avatarUrl}
            onChange={(event) => setProfile((current) => ({ ...current, avatarUrl: event.target.value }))}
          />
          <div className="seller-social-form-grid">
            <input
              name="instagram"
              placeholder="Instagram URL"
              value={profile.social.instagram}
              onChange={(event) => setProfile((current) => ({ ...current, social: { ...current.social, instagram: event.target.value } }))}
            />
            <input
              name="facebook"
              placeholder="Facebook URL"
              value={profile.social.facebook}
              onChange={(event) => setProfile((current) => ({ ...current, social: { ...current.social, facebook: event.target.value } }))}
            />
            <input
              name="tiktok"
              placeholder="TikTok URL"
              value={profile.social.tiktok}
              onChange={(event) => setProfile((current) => ({ ...current, social: { ...current.social, tiktok: event.target.value } }))}
            />
            <input
              name="youtube"
              placeholder="YouTube URL"
              value={profile.social.youtube}
              onChange={(event) => setProfile((current) => ({ ...current, social: { ...current.social, youtube: event.target.value } }))}
            />
            <input
              name="telegram"
              placeholder="Telegram URL"
              value={profile.social.telegram}
              onChange={(event) => setProfile((current) => ({ ...current, social: { ...current.social, telegram: event.target.value } }))}
            />
            <input
              name="twitter"
              placeholder="Twitter / X URL"
              value={profile.social.twitter}
              onChange={(event) => setProfile((current) => ({ ...current, social: { ...current.social, twitter: event.target.value } }))}
            />
            <input
              name="whatsapp"
              placeholder="WhatsApp URL"
              value={profile.social.whatsapp}
              onChange={(event) => setProfile((current) => ({ ...current, social: { ...current.social, whatsapp: event.target.value } }))}
            />
          </div>
          <button type="submit" disabled={profileSaving}>{profileSaving ? "Saving..." : "Save storefront"}</button>
          {profileMessage && <span className="muted">{profileMessage}</span>}
        </form>
      </section>

      <section className="panel seller-tools-panel">
        <h1>Sell a Product</h1>
        <p>Create your listing and sell to global buyers.</p>
        <form className="auth-form" onSubmit={handleCreate}>
          <input name="title" placeholder="Product title" required />
          <textarea name="description" placeholder="Product description" required rows={5} />
          <select name="category" aria-label="Product category" defaultValue="General">
            <option value="General">General</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Books">Books</option>
            <option value="Services">Services</option>
          </select>
          <input type="number" name="price" min="0.01" step="0.01" placeholder="Price (USD)" required />
          <input type="number" name="stock" min="1" step="1" placeholder="Stock" required defaultValue={1} />
          <input name="imageUrl" placeholder="Image URL (optional)" />
          <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create listing"}</button>
          {message && <span className="muted">{message}</span>}
        </form>
      </section>
    </main>
  );
}
