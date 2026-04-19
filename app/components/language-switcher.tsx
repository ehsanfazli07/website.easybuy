"use client";

import { ChangeEvent } from "react";
import { useRouter } from "next/navigation";

import { isRtlLang, langToLocale, Lang, languageOptions, normalizeLang, text } from "@/lib/i18n";

type Props = {
  lang: Lang;
};

export default function LanguageSwitcher({ lang }: Props) {
  const router = useRouter();

  function onChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLang = normalizeLang(event.target.value);
    document.cookie = `easybuy_lang=${nextLang}; Path=/; Max-Age=31536000; SameSite=Lax`;
    window.localStorage.setItem("easybuy_lang", nextLang);

    document.documentElement.lang = langToLocale(nextLang);
    document.documentElement.dir = isRtlLang(nextLang) ? "rtl" : "ltr";

    const nextPath = `${window.location.pathname}${window.location.search}`;
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <label className="lang-switch">
      <span>{text[lang].language}</span>
      <select value={lang} onChange={onChange} aria-label="Language selector">
        {languageOptions.map((item) => (
          <option key={item.code} value={item.code}>{item.label}</option>
        ))}
      </select>
    </label>
  );
}
