"use client";

import Link from "next/link";
import { signIn, signOut } from "next-auth/react";

type Props = {
  isSignedIn: boolean;
};

export default function AuthButtons({ isSignedIn }: Props) {
  if (isSignedIn) {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="auth-nav-btn auth-nav-btn--member"
      >
        Logout
      </button>
    );
  }

  return (
    <div className="auth-nav-guest">
      <button
        type="button"
        onClick={() => signIn(undefined, { callbackUrl: "/login" })}
        className="auth-nav-btn auth-nav-btn--guest"
      >
        Login
      </button>
      <Link
        href="/register"
        className="auth-nav-btn auth-nav-btn--guest"
      >
        Register
      </Link>
    </div>
  );
}
