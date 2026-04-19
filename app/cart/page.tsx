"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    priceCents: number;
  };
};

export default function CartPage() {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<CartItem[]>([]);
  const [totalCents, setTotalCents] = useState(0);
  const [message, setMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "card">("card");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCost, setShippingCost] = useState(5);
  const [deliveryEta, setDeliveryEta] = useState(5);
  const [isCheckingCapture, setIsCheckingCapture] = useState(false);
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);

  async function loadCart() {
    const res = await fetch("/api/cart");
    if (!res.ok) {
      setItems([]);
      setTotalCents(0);
      return;
    }
    const body = await res.json();
    setItems(body.items || []);
    setTotalCents(body.totalCents || 0);
  }

  useEffect(() => {
    loadCart();
  }, []);

  useEffect(() => {
    async function captureAfterReturn() {
      const paypalState = searchParams.get("paypal");
      const stripeState = searchParams.get("stripe");
      const localOrderId = searchParams.get("local_order_id");
      const paypalOrderId = searchParams.get("token");
      const stripeSessionId = searchParams.get("session_id");

      if (stripeState === "cancel") {
        setMessage("Card payment was canceled.");
        return;
      }

      if (paypalState !== "success") {
        if (paypalState === "cancel") {
          setMessage("PayPal payment was canceled.");
        }

        if (stripeState !== "success") {
          return;
        }
      }

      if (!localOrderId) {
        setMessage("Missing order confirmation parameters.");
        return;
      }

      const resolvedPaymentMethod = paypalState === "success" ? "paypal" : "card";

      if (resolvedPaymentMethod === "paypal" && !paypalOrderId) {
        setMessage("Missing PayPal confirmation parameters.");
        return;
      }

      if (resolvedPaymentMethod === "card" && !stripeSessionId) {
        setMessage("Missing card payment confirmation parameters.");
        return;
      }

      setIsCheckingCapture(true);
      const response = await fetch("/api/checkout/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localOrderId,
          paymentMethod: resolvedPaymentMethod,
          paypalOrderId,
          stripeSessionId,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Capture failed" }));
        setMessage(body.error || "Capture failed");
        setIsCheckingCapture(false);
        return;
      }

      setMessage(
        resolvedPaymentMethod === "paypal"
          ? "PayPal payment captured successfully."
          : "Card payment captured successfully."
      );
      setIsCheckingCapture(false);
      await loadCart();

      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("paypal");
      currentUrl.searchParams.delete("stripe");
      currentUrl.searchParams.delete("local_order_id");
      currentUrl.searchParams.delete("token");
      currentUrl.searchParams.delete("session_id");
      currentUrl.searchParams.delete("PayerID");
      window.history.replaceState({}, "", currentUrl.toString());
    }

    captureAfterReturn();
  }, [searchParams]);

  async function removeItem(itemId: string) {
    await fetch(`/api/cart/remove/${itemId}`, { method: "DELETE" });
    loadCart();
  }

  async function checkout() {
    setIsStartingCheckout(true);
    setMessage("");

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shippingAddress,
        shippingCostCents: Math.round(shippingCost * 100),
        deliveryEtaDays: deliveryEta,
        paymentMethod,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: "Checkout failed" }));
      setMessage(body.error || "Checkout failed");
      setIsStartingCheckout(false);
      return;
    }

    const body = await res.json().catch(() => null);
    const redirectUrl = body?.checkoutUrl || body?.approveUrl;
    if (!redirectUrl) {
      setMessage("Payment redirect URL was not received.");
      setIsStartingCheckout(false);
      return;
    }

    window.location.href = redirectUrl;
  }

  return (
    <main className="page-wrap">
      <section className="panel">
        <h1>Your Cart</h1>
        <p>Review items, choose payment, and complete checkout.</p>
      </section>
      <section className="panel">
        {items.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <ul className="cart-list">
            {items.map((item) => (
              <li key={item.id} className="cart-item">
                <div>
                  <h2>{item.product.title}</h2>
                  <p>Qty: {item.quantity}</p>
                  <p>${((item.product.priceCents * item.quantity) / 100).toFixed(2)}</p>
                </div>
                <button onClick={() => removeItem(item.id)}>Remove</button>
              </li>
            ))}
          </ul>
        )}
        <div className="auth-form mt-4">
          <input
            value={shippingAddress}
            onChange={(event) => setShippingAddress(event.target.value)}
            placeholder="Shipping address"
            required
          />
          <input
            type="number"
            min="0"
            step="1"
            value={shippingCost}
            onChange={(event) => setShippingCost(Number(event.target.value || 0))}
            placeholder="Shipping cost (USD)"
          />
          <input
            type="number"
            min="1"
            step="1"
            value={deliveryEta}
            onChange={(event) => setDeliveryEta(Number(event.target.value || 5))}
            placeholder="Delivery ETA (days)"
          />
        </div>
        <section className="payment-design">
          <h3>Secure Payment</h3>
          <p>Your payment goes through secure gateway routing to the merchant account and is stored in admin payment documents.</p>
          <div className="payment-method-grid" role="radiogroup" aria-label="Payment method">
            <button
              type="button"
              className={`payment-method-card ${paymentMethod === "card" ? "selected" : ""}`}
              onClick={() => setPaymentMethod("card")}
            >
              <strong>Global Card</strong>
              <span>Visa, MasterCard and other international cards</span>
            </button>
            <button
              type="button"
              className={`payment-method-card ${paymentMethod === "paypal" ? "selected" : ""}`}
              onClick={() => setPaymentMethod("paypal")}
            >
              <strong>PayPal</strong>
              <span>Pay with PayPal account or available card options</span>
            </button>
          </div>

          <p className="muted">
            Card checkout uses Stripe. PayPal checkout remains available. Buyer, seller, amount and reference are saved in the admin payment log.
          </p>
        </section>
        <p className="price">
          Total: ${((totalCents + Math.round(shippingCost * 100)) / 100).toFixed(2)}
        </p>
        <button
          onClick={checkout}
          disabled={items.length === 0 || isCheckingCapture || isStartingCheckout}
          className="action-btn"
        >
          {isCheckingCapture
            ? "Finalizing..."
            : isStartingCheckout
              ? "Redirecting..."
              : paymentMethod === "card"
                ? "Checkout with Card"
                : "Checkout with PayPal"}
        </button>
        {message && <p className="muted">{message}</p>}
      </section>
    </main>
  );
}
