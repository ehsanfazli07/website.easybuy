"use client";

import Image from "next/image";
import Link from "next/link";
import { getProviders, signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import Reveal from "@/app/components/reveal";

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerFlags, setProviderFlags] = useState({ google: false, apple: false });

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  useEffect(() => {
    async function loadProviders() {
      const providers = await getProviders();
      setProviderFlags({
        google: Boolean(providers?.google),
        apple: Boolean(providers?.apple),
      });
    }

    loadProviders().catch(() => undefined);
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    setError("Invalid email or password.");
  }

  return (
    <main className="auth-shell premium-auth-shell">
      <Reveal>
      <div className="auth-card glass-card premium-auth-card">
        <div className="login-brand-wrap" aria-hidden="true">
          <Image
            src="/logo.png"
            alt="EasyBuy"
            width={300}
            height={106}
            className="login-brand-logo"
            priority
          />
        </div>
        <h1 className="login-hero-title">Welcome to <span className="easybuy-name">EasyBuy</span> Store</h1>
        <p className="login-hero-subtitle">Sign in to buy, sell, follow users, and checkout products.</p>
        <form className="auth-form" onSubmit={handleLogin}>
          <label className="auth-input-wrap" aria-label="Email input">
            <span className="auth-input-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 6h16v12H4z" stroke="currentColor" strokeWidth="1.6" />
                <path d="m4 8 8 6 8-6" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <input name="email" type="email" placeholder="Email" required />
          </label>
          <label className="auth-input-wrap" aria-label="Password input">
            <span className="auth-input-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </span>
            <input name="password" type="password" placeholder="Password" required />
          </label>
          <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
          {error && <span className="auth-error">{error}</span>}
        </form>
        {providerFlags.google ? (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => signIn("google", { callbackUrl: "/" })}
          >
            Continue with Google
          </button>
        ) : null}
        {providerFlags.apple ? (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => signIn("apple", { callbackUrl: "/" })}
          >
            Continue with Apple
          </button>
        ) : null}
        <p className="auth-alt">
          No account? <Link href="/register">Create account</Link>
        </p>
      </div>
      </Reveal>
    </main>
  );
}
