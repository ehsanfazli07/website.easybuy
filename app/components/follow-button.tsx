"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  userId: string;
  loggedIn: boolean;
  initialFollowing: boolean;
  className?: string;
};

export default function FollowButton({ userId, loggedIn, initialFollowing, className }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggleFollow() {
    if (!loggedIn) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/follow/${userId}`, { method: "POST" });
    setLoading(false);

    if (!res.ok) {
      return;
    }

    const body = await res.json();
    setFollowing(Boolean(body.following));
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggleFollow}
      disabled={loading}
      className={["action-btn", className].filter(Boolean).join(" ")}
    >
      {loading ? "Please wait..." : following ? "Following" : "Follow"}
    </button>
  );
}
