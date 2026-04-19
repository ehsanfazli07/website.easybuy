import { getServerSession } from "next-auth";

import PurchaseButton from "@/app/components/purchase-button";
import Reveal from "@/app/components/reveal";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);

  let posts: Awaited<ReturnType<typeof prisma.post.findMany>> = [];
  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];

  try {
    [posts, products] = await Promise.all([
      prisma.post.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
      prisma.product.findMany({
        where: { isActive: true },
        orderBy: { createdAt: "desc" },
        take: 6,
      }),
    ]);
  } catch {
    posts = [];
    products = [];
  }

  return (
    <main className="premium-page home-page">
      <Reveal variant="slide-up" delay={40}>
        <section id="hero" className="premium-hero glass-card home-hero-surface">
          <div className="premium-hero-bg" aria-hidden="true">
            <span className="hero-gradient-core" />
            <span className="hero-wave hero-wave-one" />
            <span className="hero-wave hero-wave-two" />
            <div className="hero-particles">
              <span className="hero-particle" />
              <span className="hero-particle" />
              <span className="hero-particle" />
              <span className="hero-particle" />
              <span className="hero-particle" />
              <span className="hero-particle" />
              <span className="hero-particle" />
              <span className="hero-particle" />
              <span className="hero-particle" />
              <span className="hero-particle" />
            </div>
          </div>
          <div className="premium-hero-content">
            <h1>Modern Commerce, Beautifully Simple</h1>
            <p>
              <span className="easybuy-name">EasyBuy</span> gives you a clean premium shopping experience with social commerce,
              fast discovery, and secure checkout.
            </p>
            <div className="premium-cta-row home-cta-center">
              <a href="#products" className="premium-cta">Explore Products</a>
            </div>
          </div>
        </section>
      </Reveal>

      <Reveal variant="fade-up" delay={180}>
        <section id="services" className="premium-intro stagger-list">
          <article className="feature-card">
            <h3>Premium UI</h3>
            <p>Modern spacing, elegant typography, and smooth interactions across all devices.</p>
          </article>
          <article className="feature-card">
            <h3>Smart Discovery</h3>
            <p>Quickly find products by category, price, and relevance in a clean shop layout.</p>
          </article>
          <article className="feature-card">
            <h3>Trusted Checkout</h3>
            <p>Role-based secure flows designed for reliability and clarity.</p>
          </article>
        </section>
      </Reveal>

      <Reveal variant="fade-up" delay={240}>
        <section id="posts" className="premium-section">
          <div className="section-head">
            <h2>Latest Posts</h2>
          </div>
          <div className="premium-grid">
            {posts.length === 0 && <p className="muted">No posts available yet.</p>}
            {posts.map((post: (typeof posts)[number]) => (
              <article key={post.id} className="content-card">
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
              </article>
            ))}
          </div>
        </section>
      </Reveal>

      <Reveal variant="zoom" delay={280}>
        <section id="products" className="premium-section">
          <div className="section-head">
            <h2>Featured Products</h2>
          </div>
          <div className="premium-grid stagger-list">
            {products.length === 0 && <p className="muted">No products available yet.</p>}
            {products.map((product: (typeof products)[number]) => (
              <article key={product.id} className="content-card">
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <p className="price">${(product.priceCents / 100).toFixed(2)}</p>
                <PurchaseButton productId={product.id} canBuy={Boolean(session?.user?.id)} />
              </article>
            ))}
          </div>
        </section>
      </Reveal>

    </main>
  );
}
