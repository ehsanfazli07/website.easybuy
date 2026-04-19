"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

import PurchaseButton from "@/app/components/purchase-button";
import Reveal from "@/app/components/reveal";
import ReviewForm from "@/app/components/review-form";
import WishlistButton from "@/app/components/wishlist-button";

type Product = {
  id: string;
  title: string;
  description: string;
  category: string;
  priceCents: number;
  imageUrl?: string | null;
  reviews: Array<{ rating: number }>;
  seller: {
    id: string;
    name: string | null;
    username: string | null;
  };
};

type SellerPost = {
  id: string;
  title: string;
  excerpt: string;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
  } | null;
};

type SearchResponse = {
  products: Product[];
  posts: SellerPost[];
};

export default function ShopPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100000000);
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<SellerPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({
        q: query,
        category,
        sort,
        min: String(min),
        max: String(max),
      });
      const res = await fetch(`/api/search?${params.toString()}`);
      const body = (await res.json()) as SearchResponse;
      setProducts(Array.isArray(body.products) ? body.products : []);
      setPosts(Array.isArray(body.posts) ? body.posts : []);
      setLoading(false);
    }
    load();
  }, [category, max, min, query, sort]);

  const total = useMemo(() => products.length + posts.length, [products.length, posts.length]);

  return (
    <main className="premium-page">
      <Reveal>
      <section className="premium-section shop-toolbar">
        <h1>Shop</h1>
        <p>Discover products from users around the world.</p>
        <p className="muted search-caption">
          {query ? `Showing results for "${query}"` : "Use the header search to find products and seller posts."}
        </p>
        <div className="search-row">
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Fashion">Fashion</option>
            <option value="Books">Books</option>
            <option value="Services">Services</option>
            <option value="General">General</option>
          </select>
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
          <input
            type="number"
            min={0}
            value={Math.floor(min / 100)}
            onChange={(event) => setMin(Number(event.target.value || 0) * 100)}
            placeholder="Min $"
          />
          <input
            type="number"
            min={1}
            value={Math.floor(max / 100)}
            onChange={(event) => setMax(Number(event.target.value || 0) * 100)}
            placeholder="Max $"
          />
        </div>
        <p className="muted">{loading ? "Loading..." : `${total} result(s) found`}</p>
      </section>
      </Reveal>

      {posts.length > 0 ? (
        <Reveal>
          <section className="premium-section seller-posts-section">
            <div className="section-head">
              <h2>Seller posts</h2>
            </div>
            <div className="premium-grid">
              {posts.map((post) => (
                <article key={post.id} className="content-card">
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <p className="muted">
                    Seller: {post.author?.username || post.author?.name || "Unknown"}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </Reveal>
      ) : null}

      <section className="premium-grid shop-grid">
        {products.map((product) => (
          <Reveal key={product.id}>
          <article className="shop-card">
            <div className="shop-image-wrap">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.title} className="shop-image" />
              ) : (
                <div className="shop-image shop-image-fallback"><span className="easybuy-name">EasyBuy</span></div>
              )}
            </div>
            <h2>{product.title}</h2>
            <p>{product.description}</p>
            <p className="muted">Category: {product.category}</p>
            <p className="price">${(product.priceCents / 100).toFixed(2)}</p>
            <p className="muted">Seller: {product.seller.username || product.seller.name || "Unknown"}</p>
            <p className="muted">
              Rating: {product.reviews.length
                ? (
                    product.reviews.reduce((sum, item) => sum + item.rating, 0) / product.reviews.length
                  ).toFixed(1)
                : "No ratings yet"}
            </p>
            <PurchaseButton productId={product.id} canBuy={Boolean(session?.user?.id)} />
            <WishlistButton productId={product.id} canUse={Boolean(session?.user?.id)} />
            <ReviewForm productId={product.id} canUse={Boolean(session?.user?.id)} />
          </article>
          </Reveal>
        ))}
      </section>
    </main>
  );
}
