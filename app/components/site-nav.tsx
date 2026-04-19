"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import AuthButtons from "@/app/components/auth-buttons";
import { Lang, text } from "@/lib/i18n";

type Props = {
  userId?: string;
  hasActivePack?: boolean;
  role?: string;
  isSignedIn: boolean;
  lang: Lang;
};

type NavItem = {
  href: string;
  label: string;
  show: boolean;
  active: (pathname: string) => boolean;
};

export default function SiteNav({ userId, hasActivePack, role, isSignedIn, lang }: Props) {
  const pathname = usePathname();
  const t = text[lang];

  const items: NavItem[] = [
    { href: "/", label: t.navHome, show: true, active: (path) => path === "/" },
    { href: "/pricing", label: t.navPricing, show: true, active: (path) => path.startsWith("/pricing") },
    { href: "/about", label: t.navAbout, show: true, active: (path) => path.startsWith("/about") },
    { href: "/contact", label: t.navContact, show: true, active: (path) => path.startsWith("/contact") },
    { href: "/shop", label: t.navShop, show: true, active: (path) => path.startsWith("/shop") },
    { href: "/sell", label: t.navSell, show: Boolean(userId), active: (path) => path.startsWith("/sell") },
    { href: "/messages", label: "Messages", show: Boolean(userId), active: (path) => path.startsWith("/messages") },
    { href: "/cart", label: t.navCart, show: Boolean(userId), active: (path) => path.startsWith("/cart") },
    {
      href: "/dashboard",
      label: t.navDashboard,
      show: Boolean(hasActivePack),
      active: (path) => path.startsWith("/dashboard"),
    },
    {
      href: userId ? `/u/${userId}` : "/",
      label: t.navProfile,
      show: Boolean(userId),
      active: (path) => path.startsWith("/u/"),
    },
    { href: "/admin", label: t.navAdmin, show: role === "ADMIN", active: (path) => path.startsWith("/admin") },
  ];

  return (
    <div className="site-nav-links">
      <div className="site-nav-pages">
        {items
          .filter((item) => item.show)
          .map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`nav-pill ${item.active(pathname) ? "active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
      </div>
      <div className="site-nav-auth">
        <AuthButtons isSignedIn={isSignedIn} />
      </div>
    </div>
  );
}
