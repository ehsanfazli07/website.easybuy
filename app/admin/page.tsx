import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import AdminSiteContentForm from "@/app/components/admin-site-content-form";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasAdminAccess } from "@/lib/route-security";

type AdminOrder = Prisma.OrderGetPayload<{
  include: {
    user: { select: { email: true } };
    paymentRecord: true;
    items: {
      include: {
        product: {
          select: {
            title: true;
            seller: {
              select: {
                email: true;
                name: true;
                username: true;
              };
            };
          };
        };
      };
    };
  };
}>;

type AdminProduct = Prisma.ProductGetPayload<{
  include: { seller: { select: { email: true } } };
}>;

type AdminPayment = Prisma.PaymentRecordGetPayload<{
  include: {
    order: {
      include: {
        user: {
          select: {
            email: true;
            name: true;
            username: true;
          };
        };
        items: {
          include: {
            product: {
              select: {
                title: true;
                seller: {
                  select: {
                    email: true;
                    name: true;
                    username: true;
                  };
                };
              };
            };
          };
        };
      };
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

export default async function AdminPage() {
  let session: AppSession = null;

  try {
    session = (await getServerSession(authOptions)) as AppSession;
  } catch {
    redirect("/");
  }

  if (!session?.user || !hasAdminAccess(session.user.role, session.user.email)) {
    redirect("/");
  }

  let auditLogs: Awaited<ReturnType<typeof prisma.auditLog.findMany>> = [];
  let errorLogs: Awaited<ReturnType<typeof prisma.errorLog.findMany>> = [];
  let users: Awaited<ReturnType<typeof prisma.user.findMany>> = [];
  let orders: AdminOrder[] = [];
  let products: AdminProduct[] = [];
  let payments: AdminPayment[] = [];
  let creatorName = process.env.CREATOR_NAME || "EasyBuy Team";
  let creatorPhone = process.env.CREATOR_PHONE || "Not set";
  let creatorAbout = process.env.CREATOR_ABOUT || "Marketplace profile has not been configured yet.";
  let paypalReceiverEmail = process.env.PAYPAL_RECEIVER_EMAIL || "";
  let paypalHostedButtonId = process.env.NEXT_PUBLIC_PAYPAL_HOSTED_BUTTON_ID || "";
  let paypalHostedAction =
    process.env.NEXT_PUBLIC_PAYPAL_HOSTED_ACTION || "https://www.paypal.com/cgi-bin/webscr";
  let websiteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://easybuystores.com";
  let easybuyFacebookUrl = "https://www.facebook.com/share/1bK2X5qKMM/";
  let creatorInstagramUrl = "https://www.instagram.com/__.ehsan_fazli.__?igsh=MTN3MW5pdTNneTRibQ==";
  let creatorFacebookUrl = "https://www.facebook.com/share/1KLkuZoLH1/";
  let creatorLinks: string[] = [];

  try {
    const [creatorSetting] = await Promise.all([
      prisma.siteSetting.findUnique({ where: { key: "creatorProfile" } }),
    ]);

    if (creatorSetting?.value) {
      try {
        const parsed = JSON.parse(creatorSetting.value) as {
          name?: string;
          phone?: string;
          about?: string;
          paypalReceiverEmail?: string;
          paypalHostedButtonId?: string;
          paypalHostedAction?: string;
          websiteUrl?: string;
          easybuyFacebookUrl?: string;
          creatorInstagramUrl?: string;
          creatorFacebookUrl?: string;
          links?: string[];
        };
        creatorName = parsed.name || creatorName;
        creatorPhone = parsed.phone || creatorPhone;
        creatorAbout = parsed.about || creatorAbout;
        paypalReceiverEmail = parsed.paypalReceiverEmail || paypalReceiverEmail;
        paypalHostedButtonId = parsed.paypalHostedButtonId || paypalHostedButtonId;
        paypalHostedAction = parsed.paypalHostedAction || paypalHostedAction;
        websiteUrl = parsed.websiteUrl || websiteUrl;
        easybuyFacebookUrl = parsed.easybuyFacebookUrl || easybuyFacebookUrl;
        creatorInstagramUrl = parsed.creatorInstagramUrl || creatorInstagramUrl;
        creatorFacebookUrl = parsed.creatorFacebookUrl || creatorFacebookUrl;
        creatorLinks = Array.isArray(parsed.links) ? parsed.links : creatorLinks;
      } catch {
        // Keep defaults when malformed.
      }
    }

    [auditLogs, errorLogs, users, orders, products, payments] = await Promise.all([
      prisma.auditLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { email: true } } },
      }),
      prisma.errorLog.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { email: true } } },
      }),
      prisma.user.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { email: true } },
          paymentRecord: true,
          items: {
            include: {
              product: {
                select: {
                  title: true,
                  seller: {
                    select: {
                      email: true,
                      name: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.product.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: { seller: { select: { email: true } } },
      }),
      prisma.paymentRecord.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          order: {
            include: {
              user: {
                select: {
                  email: true,
                  name: true,
                  username: true,
                },
              },
              items: {
                include: {
                  product: {
                    select: {
                      title: true,
                      seller: {
                        select: {
                          email: true,
                          name: true,
                          username: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);
  } catch {
    auditLogs = [];
    errorLogs = [];
    users = [];
    orders = [];
    products = [];
    payments = [];
  }

  const paidPayments = payments.filter((payment) => payment.status === "Paid");
  const paidVolumeCents = paidPayments.reduce((sum, payment) => sum + payment.amountCents, 0);

  function formatProvider(provider: AdminPayment["provider"] | AdminOrder["paymentProvider"]) {
    return provider === "STRIPE" ? "Card / Stripe" : "PayPal";
  }

  return (
    <main className="page-wrap admin-page">
      <section className="panel">
        <h1>Admin Panel</h1>
        <p className="muted">Only ADMIN role can access this page.</p>
      </section>

      <div className="card-grid dashboard-block">
        <article className="panel">
          <h3>Users</h3>
          <p className="muted">{users.length} recent users</p>
        </article>
        <article className="panel">
          <h3>Orders</h3>
          <p className="muted">{orders.length} recent orders</p>
        </article>
        <article className="panel">
          <h3>Products</h3>
          <p className="muted">{products.length} recent products</p>
        </article>
        <article className="panel">
          <h3>Payments</h3>
          <p className="muted">{paidPayments.length} paid / ${(paidVolumeCents / 100).toFixed(2)} total</p>
        </article>
      </div>

      <div className="dashboard-block">
        <AdminSiteContentForm
          creatorName={creatorName}
          creatorPhone={creatorPhone}
          creatorAbout={creatorAbout}
          paypalReceiverEmail={paypalReceiverEmail}
          paypalHostedButtonId={paypalHostedButtonId}
          paypalHostedAction={paypalHostedAction}
          websiteUrl={websiteUrl}
          easybuyFacebookUrl={easybuyFacebookUrl}
          creatorInstagramUrl={creatorInstagramUrl}
          creatorFacebookUrl={creatorFacebookUrl}
          links={creatorLinks}
        />
      </div>

      <div className="card-grid dashboard-block">
        <section className="panel">
          <h2>Recent Users</h2>
          {users.map((user) => (
            <p key={user.id} className="muted">
              {user.email} - {user.role}
            </p>
          ))}
        </section>
        <section className="panel">
          <h2>Recent Orders</h2>
          {orders.map((order) => (
            <p key={order.id} className="muted">
              {order.user.email} - {order.status} / {formatProvider(order.paymentProvider)} / {order.paymentState}
            </p>
          ))}
        </section>
        <section className="panel">
          <h2>Recent Products</h2>
          {products.map((product) => (
            <p key={product.id} className="muted">
              {product.title} - {product.isActive ? "Active" : "Hidden"}
            </p>
          ))}
        </section>
      </div>

      <section className="panel dashboard-block">
        <h2>Payment Documents</h2>
        {payments.length === 0 ? (
          <p className="muted">No payment documents yet.</p>
        ) : (
          <div className="payment-document-grid">
            {payments.map((payment) => {
              const buyer =
                payment.order.user.email ||
                payment.order.user.username ||
                payment.order.user.name ||
                "Unknown buyer";
              const sellers = Array.from(
                new Set(
                  payment.order.items.map(
                    (item) =>
                      item.product.seller.username ||
                      item.product.seller.name ||
                      item.product.seller.email ||
                      "Unknown seller"
                  )
                )
              );

              return (
                <article key={payment.id} className="payment-document-card">
                  <div className="payment-document-head">
                    <div>
                      <h3>{formatProvider(payment.provider)}</h3>
                      <p className="muted">{payment.status} / ${(payment.amountCents / 100).toFixed(2)} {payment.currencyCode}</p>
                    </div>
                    <span className="payment-chip">{payment.paymentMethodType || "gateway"}</span>
                  </div>
                  <p><strong>Buyer:</strong> {buyer}</p>
                  <p><strong>Sellers:</strong> {sellers.join(", ")}</p>
                  <p><strong>Items:</strong> {payment.order.items.map((item) => item.product.title).join(", ")}</p>
                  <p><strong>Reference:</strong> {payment.providerPaymentId || payment.providerOrderId || payment.providerSessionId || payment.order.paymentReference || "n/a"}</p>
                  <p><strong>Payer Email:</strong> {payment.payerEmail || "n/a"}</p>
                  <p><strong>Country:</strong> {payment.countryCode || "n/a"}</p>
                  <p className="muted">{new Date(payment.createdAt).toLocaleString()}</p>
                  {payment.notes ? <p className="muted">{payment.notes}</p> : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="card-grid dashboard-block admin-log-grid">
        <section className="panel">
          <h2>Audit Logs</h2>
          <ul className="admin-log-list">
            {auditLogs.map((log: (typeof auditLogs)[number]) => (
              <li key={log.id}>
                <p><strong>{log.action}</strong> / {log.target}</p>
                <p className="muted">{log.details}</p>
                <p className="muted">
                  {new Date(log.createdAt).toLocaleString()} - {log.actorId || "system"}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Error Logs</h2>
          <ul className="admin-log-list">
            {errorLogs.map((log: (typeof errorLogs)[number]) => (
              <li key={log.id}>
                <p><strong>{log.message}</strong></p>
                <p className="muted">Source: {log.source}</p>
                <p className="muted">
                  {new Date(log.createdAt).toLocaleString()} - {log.actorId || "system"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
