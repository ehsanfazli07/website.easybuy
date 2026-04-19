"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getProviders, signIn } from "next-auth/react";
import { useEffect } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerFlags, setProviderFlags] = useState({ google: false, apple: false });

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") || ""),
      username: String(formData.get("username") || ""),
      email: String(formData.get("email") || ""),
      password: String(formData.get("password") || ""),
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Registration failed." }));
      setError(body.error || "Registration failed.");
      setLoading(false);
      return;
    }

    const login = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    setLoading(false);

    if (login?.ok) {
      router.push("/");
      router.refresh();
      return;
    }

    setError("Account created, but automatic login failed. Please login manually.");
  }

  return (
    <main className="auth-shell premium-auth-shell">
      <section className="auth-card glass-card premium-auth-card">
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
        <p className="login-hero-subtitle">Create your account to buy, sell, and grow your store worldwide.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <input name="name" placeholder="Full name" required />
          <input name="username" placeholder="Username" required />
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password (min 8 chars)" required />
          <button type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
          {error && <span className="auth-error">{error}</span>}
        </form>
        <div className="auth-social-row">
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
        </div>
        <p className="auth-alt">
          Already have an account? <Link href="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
