"use client";

import { useEffect, useState } from "react";

import { Lang, normalizeLang, text } from "@/lib/i18n";

type CreatorProfile = {
  creatorName: string;
  creatorPhone: string;
  creatorAbout: string;
  websiteUrl: string;
  easybuyFacebookUrl: string;
  creatorInstagramUrl: string;
  creatorFacebookUrl: string;
  links: string[];
};

function SocialIcon({ type }: { type: "facebook" | "instagram" | "website" }) {
  if (type === "website") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13.4 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.3 1.4-1.3h1.5V5.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v2h-2.5V14h2.5v7h3.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function AboutPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [creator, setCreator] = useState<CreatorProfile>({
    creatorName: "EasyBuy Team",
    creatorPhone: "Not set",
    creatorAbout: "Marketplace profile has not been configured yet.",
    websiteUrl: "https://easybuystores.com",
    easybuyFacebookUrl: "https://www.facebook.com/share/1bK2X5qKMM/",
    creatorInstagramUrl: "https://www.instagram.com/__.ehsan_fazli.__?igsh=MTN3MW5pdTNneTRibQ==",
    creatorFacebookUrl: "https://www.facebook.com/share/1KLkuZoLH1/",
    links: [],
  });

  const t = text[lang];

  useEffect(() => {
    const cookie = document.cookie
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith("easybuy_lang="));
    setLang(normalizeLang(cookie?.split("=")[1]));

    async function loadCreator() {
      const res = await fetch("/api/site-content", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as Partial<CreatorProfile>;
      setCreator((prev) => ({
        creatorName: data.creatorName || prev.creatorName,
        creatorPhone: data.creatorPhone || prev.creatorPhone,
        creatorAbout: data.creatorAbout || prev.creatorAbout,
        websiteUrl: data.websiteUrl || prev.websiteUrl,
        easybuyFacebookUrl: data.easybuyFacebookUrl || prev.easybuyFacebookUrl,
        creatorInstagramUrl: data.creatorInstagramUrl || prev.creatorInstagramUrl,
        creatorFacebookUrl: data.creatorFacebookUrl || prev.creatorFacebookUrl,
        links: Array.isArray(data.links) ? data.links : prev.links,
      }));
    }

    loadCreator();
  }, []);

  return (
    <main className="premium-page">
      <section className="panel about-hero-panel">
        <h1>{t.aboutTitle}</h1>
        <p>
          {t.aboutSubtitle}
        </p>
      </section>

      <section className="panel creator-section">
        <h2>{t.creatorTitle}</h2>
        <p><strong>{creator.creatorName}</strong></p>
        <p>{creator.creatorAbout}</p>
        <p>{t.creatorContact}: {creator.creatorPhone}</p>
        <div className="creator-social-groups">
          <div className="creator-social-block">
            <h3>EasyBuy</h3>
            <div className="creator-social-row">
              {creator.websiteUrl ? (
                <a href={creator.websiteUrl} target="_blank" rel="noreferrer" className="creator-social-icon" aria-label="EasyBuy Website">
                  <SocialIcon type="website" />
                </a>
              ) : null}
              {creator.easybuyFacebookUrl ? (
                <a href={creator.easybuyFacebookUrl} target="_blank" rel="noreferrer" className="creator-social-icon" aria-label="EasyBuy Facebook">
                  <SocialIcon type="facebook" />
                </a>
              ) : null}
            </div>
          </div>
          <div className="creator-social-block">
            <h3>Creator</h3>
            <div className="creator-social-row">
              {creator.creatorInstagramUrl ? (
                <a href={creator.creatorInstagramUrl} target="_blank" rel="noreferrer" className="creator-social-icon" aria-label="Creator Instagram">
                  <SocialIcon type="instagram" />
                </a>
              ) : null}
              {creator.creatorFacebookUrl ? (
                <a href={creator.creatorFacebookUrl} target="_blank" rel="noreferrer" className="creator-social-icon" aria-label="Creator Facebook">
                  <SocialIcon type="facebook" />
                </a>
              ) : null}
            </div>
          </div>
        </div>
        {creator.links.length > 0 ? (
          <>
            <p>{t.creatorLinks}:</p>
            <div className="creator-links-wrap open">
              {creator.links.map((link) => (
                <a key={link} href={link} target="_blank" rel="noreferrer" className="creator-link-chip">
                  {link.replace(/^https?:\/\//, "")}
                </a>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="grid-panels">
        <article className="panel">
          <h2>Buy &amp; Sell Easily</h2>
          <p>
            This website is designed for both buying and selling a wide range of products.
            Anyone can easily join and start selling or purchasing items without any difficulty.
            Our goal is to connect trade and grow their business.
          </p>
        </article>
        <article className="panel">
          <h2>What You Can Find</h2>
          <p>
            Electronic device, home appliances, car and motorcycle, daily essential products.
          </p>
        </article>
        <article className="panel">
          <h2>Grow Your Business</h2>
          <p>
            This website is designed for both buying and selling without any difficulty.
            Our goal is to create a simple and powerful marketplace where people can connect,
            trade, and grow. Join us and start your online business today.
          </p>
        </article>
      </section>
    </main>
  );
}
