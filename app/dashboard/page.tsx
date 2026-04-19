import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { langToLocale, normalizeLang, text } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

type DashboardOrder = Prisma.OrderGetPayload<{
  include: {
    paymentRecord: true;
    items: {
      include: {
        product: {
          select: { title: true };
        };
      };
    };
  };
}>;

type DashboardWishlistItem = Prisma.WishlistItemGetPayload<{
  include: {
    product: {
      select: { title: true };
    };
  };
}>;

type AppSession = {
  user?: {
    id?: string;
    role?: string;
    hasActivePack?: boolean;
    name?: string | null;
    email?: string | null;
  };
} | null;

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const lang = normalizeLang(cookieStore.get("easybuy_lang")?.value);
  const t = text[lang];

  let session: AppSession = null;

  try {
    session = (await getServerSession(authOptions)) as AppSession;
  } catch {
    redirect("/login");
  }

  if (!session?.user?.id || !session.user.hasActivePack) {
    redirect("/");
  }

  let purchases: Awaited<ReturnType<typeof prisma.purchase.findMany>> = [];
  let orders: DashboardOrder[] = [];
  let notifications: Awaited<ReturnType<typeof prisma.notification.findMany>> = [];
  let wishlist: DashboardWishlistItem[] = [];

  try {
    purchases = await prisma.purchase.findMany({
      where: { userId: session.user.id, status: "active" },
      include: { product: true },
      orderBy: { purchasedAt: "desc" },
    });

    orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: {
        paymentRecord: true,
        items: {
          include: {
            product: {
              select: { title: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    wishlist = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
  } catch {
    purchases = [];
    orders = [];
    notifications = [];
    wishlist = [];
  }

  return (
    <main className="page-wrap dashboard-page">
      <section className="panel">
        <h1>{t.dashboardTitle}</h1>
        <p className="muted">
        Welcome back, {session.user.name || session.user.email}.
        </p>
      </section>

      <section className="panel dashboard-block">
        <h2>Market Overview</h2>
        {(() => {
          const now = new Date();
          const labels: string[] = [];
          const totals: number[] = [];

          for (let i = 5; i >= 0; i -= 1) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = date.toLocaleString(langToLocale(lang), { month: "short" });
            labels.push(monthLabel);

            const monthOrders = orders.filter((order) => {
              const d = new Date(order.createdAt);
              return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth();
            });

            totals.push(monthOrders.reduce((sum, order) => sum + order.totalCents, 0));
          }

          const peak = Math.max(...totals, 1);
          const totalRevenue = orders.reduce((sum, order) => sum + order.totalCents, 0);
          const postViewIndex = orders.reduce((sum, order) => sum + order.items.length, 0) * 42;
          const marketStatus = totalRevenue > 0 ? "Growing" : "Starting";

          return (
            <>
              <div className="card-grid">
                <article className="product-card">
                  <h3>Total Revenue</h3>
                  <p className="price">${(totalRevenue / 100).toFixed(2)}</p>
                </article>
                <article className="product-card">
                  <h3>Post Views (Index)</h3>
                  <p className="price">{postViewIndex}</p>
                </article>
                <article className="product-card">
                  <h3>Market Status</h3>
                  <p className="price">{marketStatus}</p>
                </article>
              </div>

              <div className="dashboard-chart" aria-label="Monthly revenue chart">
                {totals.map((value, idx) => (
                  (() => {
                    const level = Math.max(1, Math.min(10, Math.round((value / peak) * 10)));
                    return (
                  <div key={`${labels[idx]}-${value}`} className="chart-col">
                    <div className="chart-value">${(value / 100).toFixed(0)}</div>
                    <div className="chart-bar-wrap">
                      <div className={`chart-bar level-${level}`} />
                    </div>
                    <div className="chart-label">{labels[idx]}</div>
                  </div>
                    );
                  })()
                ))}
              </div>
            </>
          );
        })()}
      </section>

      <section className="card-grid dashboard-block">
        {purchases.length === 0 ? (
          <div className="panel muted">
            You do not have an active package yet.
          </div>
        ) : (
          purchases.map((item: (typeof purchases)[number]) => (
            <article key={item.id} className="product-card">
              <h2>Purchase #{item.productId}</h2>
              <p className="muted">Your package is active and available in your account.</p>
              <p className="muted">
                Active since {new Date(item.purchasedAt).toLocaleDateString()}
              </p>
            </article>
          ))
        )}
      </section>

      <section className="panel dashboard-block">
        <h2>Orders</h2>
        {orders.length === 0 ? (
          <p className="muted">No orders yet.</p>
        ) : (
          orders.map((order) => (
            <article key={order.id} className="product-card">
              <p>
                Order {order.id.slice(0, 8)} - <strong>{order.status}</strong>
              </p>
              <p className="muted">Total: ${(order.totalCents / 100).toFixed(2)}</p>
              <p className="muted">
                Payment: {order.paymentProvider === "STRIPE" ? "Card / Stripe" : "PayPal"} / {order.paymentState}
              </p>
              <p className="muted">Items: {order.items.map((item) => item.product.title).join(", ")}</p>
            </article>
          ))
        )}
      </section>

      <section className="panel dashboard-block">
        <h2>Wishlist</h2>
        {wishlist.length === 0 ? (
          <p className="muted">Your wishlist is empty.</p>
        ) : (
          wishlist.map((item) => (
            <article key={item.id} className="product-card">
              <p>{item.product.title}</p>
            </article>
          ))
        )}
      </section>

      <section className="panel dashboard-block">
        <h2>Notifications</h2>
        {notifications.length === 0 ? (
          <p className="muted">No notifications.</p>
        ) : (
          notifications.map((note) => (
            <article key={note.id} className="product-card">
              <p>
                <strong>{note.title}</strong>
              </p>
              <p>{note.message}</p>
              <p className="muted">{new Date(note.createdAt).toLocaleString()}</p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
