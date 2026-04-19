import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import HeaderSettingsMenu from "@/app/components/header-settings-menu";
import LanguageBootstrap from "@/app/components/language-bootstrap";
import Providers from "@/app/providers";
import ScrollEffects from "@/app/components/scroll-effects";
import SiteEntryAnimation from "@/app/components/site-entry-animation";
import SiteNav from "@/app/components/site-nav";
import { authOptions } from "@/lib/auth";
import { isRtlLang, langToLocale, normalizeLang, text } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: "EasyBuy",
  description: "Dynamic posts/products with secure login and RBAC.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = (await getServerSession(authOptions)) as Session | null;
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("easybuy_lang")?.value);
  const t = text[lang];

  return (
    <html
      lang={langToLocale(lang)}
      dir={isRtlLang(lang) ? "rtl" : "ltr"}
      className="h-full antialiased"
    >
      <body className="min-h-full bg-slate-50 text-slate-900 flex flex-col">
        <Providers session={session}>
          <LanguageBootstrap currentLang={lang} />
          <ScrollEffects />
          <SiteEntryAnimation />
          <header>
            <div className="header-shell mx-auto w-full px-6 py-4">
              <div className="header-brand-row">
                <Link href="/" className="header-brand text-lg font-bold tracking-tight flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt={t.brand}
                    width={1500}
                    height={530}
                    quality={95}
                    sizes="(max-width: 480px) 98vw, (max-width: 860px) 95vw, 1500px"
                    priority
                    className="header-logo-img"
                  />
                </Link>
                <HeaderSettingsMenu
                  lang={lang}
                  userEmail={session?.user?.email}
                />
              </div>

              <form action="/shop" method="get" className="header-global-search header-google-like search-row premium-search">
                <span className="header-search-icon-inline" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                    <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <input className="header-search-input" name="q" placeholder={t.searchPlaceholder} />
                <button type="submit" className="header-search-submit-inline" aria-label={t.searchButton}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
                    <path d="m13 6 6 6-6 6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>

              <nav className="header-nav-row">
              <SiteNav
                userId={session?.user?.id}
                hasActivePack={session?.user?.hasActivePack}
                role={session?.user?.role}
                isSignedIn={Boolean(session?.user)}
                lang={lang}
              />
              </nav>
            </div>
          </header>
          <div className="flex-1 app-content-shell">{children}</div>
        </Providers>
      </body>
    </html>
  );
}
