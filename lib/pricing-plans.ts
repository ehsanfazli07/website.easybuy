export type PricingPlan = {
  id: string;
  price: string;
  duration: string;
  note: string;
  totalCents: number;
};

export const pricingPlans: PricingPlan[] = [
  {
    id: "monthly",
    price: "$7.99",
    duration: "1 Month",
    note: "Great for getting started.",
    totalCents: 799,
  },
  {
    id: "half-year",
    price: "$46.99",
    duration: "6 Months",
    note: "Best for active buyers and sellers.",
    totalCents: 4699,
  },
  {
    id: "yearly",
    price: "$87.99",
    duration: "1 Year",
    note: "Full value plan for long-term growth.",
    totalCents: 8799,
  },
];

export function getPricingPlan(planId: string) {
  return pricingPlans.find((plan) => plan.id === planId) || null;
}
