import { cookies } from "next/headers";

import PricingPlanCard from "@/app/components/pricing-plan-card";
import Reveal from "@/app/components/reveal";
import { normalizeLang, text } from "@/lib/i18n";
import { pricingPlans } from "@/lib/pricing-plans";
import { prisma } from "@/lib/prisma";

export default async function PricingPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("easybuy_lang")?.value);
  const t = text[lang];

  let paypalHostedButtonId = "";
  let paypalHostedAction = "https://www.paypal.com/cgi-bin/webscr";

  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "creatorProfile" },
      select: { value: true },
    });

    if (setting?.value) {
      const parsed = JSON.parse(setting.value) as {
        paypalHostedButtonId?: string;
        paypalHostedAction?: string;
      };

      paypalHostedButtonId = (parsed.paypalHostedButtonId || "").trim();
      paypalHostedAction =
        (parsed.paypalHostedAction || "https://www.paypal.com/cgi-bin/webscr").trim();
    }
  } catch {
    paypalHostedButtonId = "";
    paypalHostedAction = "https://www.paypal.com/cgi-bin/webscr";
  }

  return (
    <main className="premium-page">
      <Reveal>
        <section className="premium-section pricing-head">
          <h1>{t.pricingTitle}</h1>
          <p>{t.pricingSubtitle}</p>
        </section>
      </Reveal>

      <section className="pricing-grid">
        {pricingPlans.map((plan) => (
          <Reveal key={plan.duration}>
            <PricingPlanCard
              plan={plan}
              paypalHostedButtonId={paypalHostedButtonId}
              paypalHostedAction={paypalHostedAction}
            />
          </Reveal>
        ))}
      </section>
    </main>
  );
}
