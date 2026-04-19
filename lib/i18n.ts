export const supportedLangs = [
  "en",
  "fa",
  "da",
  "ps",
  "ar",
  "ur",
  "hi",
  "tr",
  "fr",
  "de",
  "es",
  "it",
  "pt",
  "ru",
  "zh-cn",
  "zh-tw",
  "ja",
  "ko",
  "ms",
  "id",
  "th",
  "vi",
  "tl",
  "bn",
  "pa",
  "ta",
  "te",
  "gu",
  "mr",
  "uk",
  "pl",
  "nl",
  "sv",
  "no",
  "fi",
  "el",
  "he",
  "ro",
  "hu",
  "cs",
  "sk",
  "bg",
  "sr",
  "hr",
  "sq",
  "so",
  "sw",
  "ku",
] as const;

export type Lang = (typeof supportedLangs)[number];

export type UiText = {
  brand: string;
  navHome: string;
  navPricing: string;
  navAbout: string;
  navContact: string;
  navShop: string;
  navSell: string;
  navCart: string;
  navDashboard: string;
  navProfile: string;
  navAdmin: string;
  searchPlaceholder: string;
  searchButton: string;
  language: string;
  pricingTitle: string;
  pricingSubtitle: string;
  aboutTitle: string;
  aboutSubtitle: string;
  creatorTitle: string;
  creatorContact: string;
  creatorLinks: string;
  dashboardTitle: string;
  settingsOpen: string;
  settingsTitle: string;
  settingsAccount: string;
  settingsSupport: string;
};

const enText: UiText = {
  brand: "EasyBuy",
  navHome: "Home",
  navPricing: "Pricing",
  navAbout: "About",
  navContact: "Contact",
  navShop: "Shop",
  navSell: "Sell",
  navCart: "Cart",
  navDashboard: "Dashboard",
  navProfile: "Profile",
  navAdmin: "Admin",
  searchPlaceholder: "Search products, categories, sellers...",
  searchButton: "Search",
  language: "Language",
  pricingTitle: "Pricing Plans",
  pricingSubtitle: "Choose a plan and unlock premium marketplace experience.",
  aboutTitle: "About EasyBuy",
  aboutSubtitle: "A simple marketplace experience focused on easy buying, easy selling, and business growth.",
  creatorTitle: "About Creator",
  creatorContact: "Contact",
  creatorLinks: "Links",
  dashboardTitle: "Buyer Dashboard",
  settingsOpen: "Open quick settings",
  settingsTitle: "Quick settings",
  settingsAccount: "Account",
  settingsSupport: "Support",
};

const faText: UiText = {
  brand: "ایزی‌بای",
  navHome: "خانه",
  navPricing: "قیمت‌ها",
  navAbout: "درباره",
  navContact: "تماس",
  navShop: "فروشگاه",
  navSell: "فروش",
  navCart: "سبد خرید",
  navDashboard: "داشبورد",
  navProfile: "پروفایل",
  navAdmin: "ادمین",
  searchPlaceholder: "جستجوی محصول، دسته‌بندی و فروشنده...",
  searchButton: "جستجو",
  language: "زبان",
  pricingTitle: "پلن‌های قیمت",
  pricingSubtitle: "پلن مناسب را انتخاب کنید و تجربه حرفه‌ای بازار را فعال کنید.",
  aboutTitle: "درباره ایزی‌بای",
  aboutSubtitle: "بازار آنلاین ساده برای خرید، فروش و رشد کسب‌وکار.",
  creatorTitle: "درباره سازنده",
  creatorContact: "تماس",
  creatorLinks: "لینک‌ها",
  dashboardTitle: "داشبورد خریدار",
  settingsOpen: "باز کردن تنظیمات سریع",
  settingsTitle: "تنظیمات سریع",
  settingsAccount: "حساب",
  settingsSupport: "پشتیبانی",
};

const arText: UiText = {
  brand: "إيزي باي",
  navHome: "الرئيسية",
  navPricing: "الأسعار",
  navAbout: "حول",
  navContact: "اتصل",
  navShop: "المتجر",
  navSell: "البيع",
  navCart: "السلة",
  navDashboard: "لوحة التحكم",
  navProfile: "الملف الشخصي",
  navAdmin: "الإدارة",
  searchPlaceholder: "ابحث عن المنتجات والفئات والبائعين...",
  searchButton: "بحث",
  language: "اللغة",
  pricingTitle: "خطط الأسعار",
  pricingSubtitle: "اختر باقتك وافتح تجربة سوق احترافية.",
  aboutTitle: "حول إيزي باي",
  aboutSubtitle: "سوق بسيط للشراء والبيع ونمو الأعمال.",
  creatorTitle: "عن المنشئ",
  creatorContact: "التواصل",
  creatorLinks: "الروابط",
  dashboardTitle: "لوحة المشتري",
  settingsOpen: "فتح الإعدادات السريعة",
  settingsTitle: "الإعدادات السريعة",
  settingsAccount: "الحساب",
  settingsSupport: "الدعم",
};

const customText: Partial<Record<Lang, UiText>> = {
  en: enText,
  fa: faText,
  da: faText,
  ps: faText,
  ar: arText,
};

const languageLabelMap: Record<Lang, string> = {
  en: "English",
  fa: "فارسی",
  da: "دری",
  ps: "پښتو",
  ar: "العربية",
  ur: "اردو",
  hi: "Hindi",
  tr: "Turkish",
  fr: "French",
  de: "German",
  es: "Spanish",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  "zh-cn": "Chinese (Simplified)",
  "zh-tw": "Chinese (Traditional)",
  ja: "Japanese",
  ko: "Korean",
  ms: "Malay",
  id: "Indonesian",
  th: "Thai",
  vi: "Vietnamese",
  tl: "Tagalog",
  bn: "Bengali",
  pa: "Punjabi",
  ta: "Tamil",
  te: "Telugu",
  gu: "Gujarati",
  mr: "Marathi",
  uk: "Ukrainian",
  pl: "Polish",
  nl: "Dutch",
  sv: "Swedish",
  no: "Norwegian",
  fi: "Finnish",
  el: "Greek",
  he: "Hebrew",
  ro: "Romanian",
  hu: "Hungarian",
  cs: "Czech",
  sk: "Slovak",
  bg: "Bulgarian",
  sr: "Serbian",
  hr: "Croatian",
  sq: "Albanian",
  so: "Somali",
  sw: "Swahili",
  ku: "Kurdish",
};

function buildFallbackText(lang: Lang): UiText {
  const label = languageLabelMap[lang] || lang.toUpperCase();

  return {
    ...enText,
    navHome: `${enText.navHome} (${label})`,
    navPricing: `${enText.navPricing} (${label})`,
    navAbout: `${enText.navAbout} (${label})`,
    navContact: `${enText.navContact} (${label})`,
    navShop: `${enText.navShop} (${label})`,
    navSell: `${enText.navSell} (${label})`,
    navCart: `${enText.navCart} (${label})`,
    navDashboard: `${enText.navDashboard} (${label})`,
    navProfile: `${enText.navProfile} (${label})`,
    navAdmin: `${enText.navAdmin} (${label})`,
    searchPlaceholder: `${enText.searchPlaceholder} (${label})`,
    searchButton: `${enText.searchButton} (${label})`,
    language: label,
    pricingTitle: `${enText.pricingTitle} (${label})`,
    pricingSubtitle: `${enText.pricingSubtitle} (${label})`,
    aboutTitle: `${enText.aboutTitle} (${label})`,
    aboutSubtitle: `${enText.aboutSubtitle} (${label})`,
    creatorTitle: `${enText.creatorTitle} (${label})`,
    creatorContact: `${enText.creatorContact} (${label})`,
    creatorLinks: `${enText.creatorLinks} (${label})`,
    dashboardTitle: `${enText.dashboardTitle} (${label})`,
    settingsOpen: `${enText.settingsOpen} (${label})`,
    settingsTitle: `${enText.settingsTitle} (${label})`,
    settingsAccount: `${enText.settingsAccount} (${label})`,
    settingsSupport: `${enText.settingsSupport} (${label})`,
  };
}

export const text: Record<Lang, UiText> = supportedLangs.reduce((acc, lang) => {
  acc[lang] = customText[lang] || buildFallbackText(lang);
  return acc;
}, {} as Record<Lang, UiText>);

const langAliases: Record<string, Lang> = {
  en: "en",
  english: "en",
  fa: "fa",
  dari: "da",
  da: "da",
  prs: "da",
  "fa-af": "da",
  ps: "ps",
  pushto: "ps",
  pashto: "ps",
  ar: "ar",
  arabic: "ar",
  ur: "ur",
  hi: "hi",
  tr: "tr",
  fr: "fr",
  de: "de",
  es: "es",
  it: "it",
  pt: "pt",
  ru: "ru",
  "zh-cn": "zh-cn",
  "zh_cn": "zh-cn",
  "zh-hans": "zh-cn",
  zh: "zh-cn",
  cn: "zh-cn",
  "zh-tw": "zh-tw",
  "zh_tw": "zh-tw",
  "zh-hant": "zh-tw",
  tw: "zh-tw",
  ja: "ja",
  ko: "ko",
  ms: "ms",
  id: "id",
  th: "th",
  vi: "vi",
  tl: "tl",
  bn: "bn",
  pa: "pa",
  ta: "ta",
  te: "te",
  gu: "gu",
  mr: "mr",
  uk: "uk",
  pl: "pl",
  nl: "nl",
  sv: "sv",
  no: "no",
  fi: "fi",
  el: "el",
  he: "he",
  ro: "ro",
  hu: "hu",
  cs: "cs",
  sk: "sk",
  bg: "bg",
  sr: "sr",
  hr: "hr",
  sq: "sq",
  so: "so",
  sw: "sw",
  ku: "ku",
};

export function normalizeLang(input?: string | null): Lang {
  if (!input) {
    return "en";
  }

  const value = input.trim().toLowerCase().replace(/_/g, "-");
  const alias = langAliases[value];
  if (alias) {
    return alias;
  }

  if (value.startsWith("zh-")) {
    if (value.includes("tw") || value.includes("hant")) {
      return "zh-tw";
    }
    return "zh-cn";
  }

  const shortCode = value.split("-")[0];
  if (shortCode && supportedLangs.includes(shortCode as Lang)) {
    return shortCode as Lang;
  }

  return supportedLangs.includes(value as Lang) ? (value as Lang) : "en";
}

export function isRtlLang(lang: Lang) {
  return lang === "ar" || lang === "fa" || lang === "da" || lang === "ps" || lang === "ur" || lang === "he";
}

export function langToLocale(lang: Lang) {
  const localeMap: Record<Lang, string> = {
    en: "en-US",
    fa: "fa-IR",
    da: "fa-AF",
    ps: "ps-AF",
    ar: "ar-SA",
    ur: "ur-PK",
    hi: "hi-IN",
    tr: "tr-TR",
    fr: "fr-FR",
    de: "de-DE",
    es: "es-ES",
    it: "it-IT",
    pt: "pt-PT",
    ru: "ru-RU",
    "zh-cn": "zh-CN",
    "zh-tw": "zh-TW",
    ja: "ja-JP",
    ko: "ko-KR",
    ms: "ms-MY",
    id: "id-ID",
    th: "th-TH",
    vi: "vi-VN",
    tl: "tl-PH",
    bn: "bn-BD",
    pa: "pa-IN",
    ta: "ta-IN",
    te: "te-IN",
    gu: "gu-IN",
    mr: "mr-IN",
    uk: "uk-UA",
    pl: "pl-PL",
    nl: "nl-NL",
    sv: "sv-SE",
    no: "nb-NO",
    fi: "fi-FI",
    el: "el-GR",
    he: "he-IL",
    ro: "ro-RO",
    hu: "hu-HU",
    cs: "cs-CZ",
    sk: "sk-SK",
    bg: "bg-BG",
    sr: "sr-RS",
    hr: "hr-HR",
    sq: "sq-AL",
    so: "so-SO",
    sw: "sw-KE",
    ku: "ku-TR",
  };

  return localeMap[lang] || "en-US";
}

export const languageOptions: Array<{ code: Lang; label: string }> = [
  { code: "en", label: "English" },
  { code: "fa", label: "فارسی" },
  { code: "da", label: "دری" },
  { code: "ps", label: "پښتو" },
  { code: "ar", label: "العربية" },
  { code: "ur", label: "اردو" },
  { code: "hi", label: "Hindi" },
  { code: "tr", label: "Turkish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "it", label: "Italian" },
  { code: "pt", label: "Portuguese" },
  { code: "ru", label: "Russian" },
  { code: "zh-cn", label: "Chinese (Simplified)" },
  { code: "zh-tw", label: "Chinese (Traditional)" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "ms", label: "Malay" },
  { code: "id", label: "Indonesian" },
  { code: "th", label: "Thai" },
  { code: "vi", label: "Vietnamese" },
  { code: "tl", label: "Tagalog" },
  { code: "bn", label: "Bengali" },
  { code: "pa", label: "Punjabi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "gu", label: "Gujarati" },
  { code: "mr", label: "Marathi" },
  { code: "uk", label: "Ukrainian" },
  { code: "pl", label: "Polish" },
  { code: "nl", label: "Dutch" },
  { code: "sv", label: "Swedish" },
  { code: "no", label: "Norwegian" },
  { code: "fi", label: "Finnish" },
  { code: "el", label: "Greek" },
  { code: "he", label: "Hebrew" },
  { code: "ro", label: "Romanian" },
  { code: "hu", label: "Hungarian" },
  { code: "cs", label: "Czech" },
  { code: "sk", label: "Slovak" },
  { code: "bg", label: "Bulgarian" },
  { code: "sr", label: "Serbian" },
  { code: "hr", label: "Croatian" },
  { code: "sq", label: "Albanian" },
  { code: "so", label: "Somali" },
  { code: "sw", label: "Swahili" },
  { code: "ku", label: "Kurdish" },
];
