"use client";

import { useState } from "react";

import LanguageSwitcher from "@/app/components/language-switcher";
import { Lang, text } from "@/lib/i18n";

type Props = {
  lang: Lang;
  userEmail?: string | null;
};

export default function HeaderSettingsMenu({ lang, userEmail }: Props) {
  const [open, setOpen] = useState(false);
  const supportEmail = "info@easybuystores.com";
  const instagramUrl = "https://www.instagram.com/easybuystores?igsh=MTJqYmVmM2FpeTk1ZQ==";
  const t = text[lang];

  return (
    <div className="header-settings-wrap">
      <button
        type="button"
        className="header-settings-btn"
        aria-label={t.settingsOpen}
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M10.4 2.8a1.5 1.5 0 0 1 3.2 0l.3 1.3a7.9 7.9 0 0 1 1.7.7l1.2-.7a1.5 1.5 0 0 1 2.2 1.2l.1 1.3c.5.4.9.9 1.2 1.5l1.3.3a1.5 1.5 0 0 1 0 3.2l-1.3.3c-.3.6-.7 1.1-1.2 1.5l-.1 1.3a1.5 1.5 0 0 1-2.2 1.2l-1.2-.7a7.9 7.9 0 0 1-1.7.7l-.3 1.3a1.5 1.5 0 0 1-3.2 0l-.3-1.3a7.9 7.9 0 0 1-1.7-.7l-1.2.7a1.5 1.5 0 0 1-2.2-1.2l-.1-1.3a7.1 7.1 0 0 1-1.2-1.5l-1.3-.3a1.5 1.5 0 0 1 0-3.2l1.3-.3c.3-.6.7-1.1 1.2-1.5l.1-1.3a1.5 1.5 0 0 1 2.2-1.2l1.2.7a7.9 7.9 0 0 1 1.7-.7l.3-1.3Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {open ? (
        <div className="header-settings-panel">
          <div className="header-settings-title">{t.settingsTitle}</div>
          <LanguageSwitcher lang={lang} />
          {userEmail ? (
            <div className="header-settings-account">
              <div className="header-settings-support-title">{t.settingsAccount}</div>
              <a className="header-settings-email" href={`mailto:${userEmail}`}>
                {userEmail}
              </a>
            </div>
          ) : null}
          <div className="header-settings-support">
            <div className="header-settings-support-title">{t.settingsSupport}</div>
            <a className="header-settings-email" href={`mailto:${supportEmail}`}>
              {supportEmail}
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="header-settings-instagram"
              aria-label="Open EasyBuy Instagram"
              onClick={() => setOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.7" />
                <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
              </svg>
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
