"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { isRtlLang, langToLocale, normalizeLang } from "@/lib/i18n";

type Props = {
  currentLang: string;
};

export default function LanguageBootstrap({ currentLang }: Props) {
  const router = useRouter();

  useEffect(() => {
    const stored = window.localStorage.getItem("easybuy_lang");
    if (!stored) {
      window.localStorage.setItem("easybuy_lang", normalizeLang(currentLang));
      return;
    }

    const normalizedStored = normalizeLang(stored);
    const normalizedCurrent = normalizeLang(currentLang);

    if (normalizedStored !== normalizedCurrent) {
      document.cookie = `easybuy_lang=${normalizedStored}; Path=/; Max-Age=31536000; SameSite=Lax`;
      document.documentElement.lang = langToLocale(normalizedStored);
      document.documentElement.dir = isRtlLang(normalizedStored) ? "rtl" : "ltr";
      const nextPath = `${window.location.pathname}${window.location.search}`;
      router.replace(nextPath);
      router.refresh();
      return;
    }

    document.cookie = `easybuy_lang=${normalizedStored}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = langToLocale(normalizedStored);
    document.documentElement.dir = isRtlLang(normalizedStored) ? "rtl" : "ltr";
  }, [currentLang, router]);

  return null;
}
