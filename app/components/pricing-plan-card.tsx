"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import type { PricingPlan } from "@/lib/pricing-plans";

type Props = {
  plan: PricingPlan;
  paypalHostedButtonId: string;
  paypalHostedAction: string;
};

export default function PricingPlanCard({
  plan,
  paypalHostedButtonId,
  paypalHostedAction,
}: Props) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const hostedButtonId = (paypalHostedButtonId || "").trim();
  const paypalAction =
    (paypalHostedAction || "https://www.paypal.com/cgi-bin/webscr").trim();

  const autoMessage = useMemo(() => {
    const userName =
      session?.user?.name ||
      session?.user?.email ||
      session?.user?.id ||
      "unknown-user";

    return `EasyBuy Pricing | Plan: ${plan.duration} (${plan.price}) | User: ${userName} | UTC: ${new Date().toISOString()}`;
  }, [plan.duration, plan.price, session?.user?.email, session?.user?.id, session?.user?.name]);

  async function onSubmitDirectPaypal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (status === "loading") {
      return;
    }

    if (!session?.user?.id) {
      router.push("/login");
      return;
    }

    if (!hostedButtonId) {
      return;
    }

    setLoading(true);

    // Log purchase intent for admins before redirecting to PayPal hosted checkout.
    await fetch("/api/pricing/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId: plan.id,
        personalMessage: autoMessage.slice(0, 200),
      }),
    }).catch(() => undefined);

    formRef.current?.submit();
  }

  return (
    <article className="pricing-card">
      <h2>{plan.price}</h2>
      <p className="plan-duration">{plan.duration}</p>
      <p className="muted">{plan.note}</p>
      <form
        ref={formRef}
        action={paypalAction}
        method="post"
        target="_top"
        className="pricing-paypal-form"
        onSubmit={onSubmitDirectPaypal}
      >
        <input type="hidden" name="cmd" value="_s-xclick" />
        <input type="hidden" name="hosted_button_id" value={hostedButtonId} />
        <input type="hidden" name="on0" value="Purchase Message:" />
        <input type="hidden" name="os0" value={autoMessage.slice(0, 200)} />
        <input type="hidden" name="currency_code" value="USD" />
        <button
          type="submit"
          className="premium-cta pricing-buy"
          disabled={loading || status === "loading" || !hostedButtonId}
        >
          {loading ? "Processing..." : "Pay with PayPal / Card"}
        </button>
      </form>
    </article>
  );
}
