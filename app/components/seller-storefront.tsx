"use client";

import { useDeferredValue, useEffect, useRef, useState } from "react";

import FollowButton from "@/app/components/follow-button";
import PurchaseButton from "@/app/components/purchase-button";
import SellerMessageButton from "@/app/components/seller-message-button";
import type {
  SellerProductCard,
  SellerSocialPlatform,
  SellerStorefrontResponse,
} from "@/types/seller-storefront";
import { sellerSocialPlatforms } from "@/types/seller-storefront";

type Props = {
  sellerId: string;
  loggedIn: boolean;
  isOwner: boolean;
  initialData: SellerStorefrontResponse;
};

function formatPrice(priceCents: number) {
  return `$${(priceCents / 100).toFixed(2)}`;
}

function renderStars(rating: number) {
  const rounded = Math.round(rating);
  return Array.from({ length: 5 }, (_, index) => (index < rounded ? "★" : "☆")).join("");
}

function platformLabel(platform: SellerSocialPlatform) {
  if (platform === "twitter") {
    return "X";
  }

  return platform.charAt(0).toUpperCase() + platform.slice(1);
}

function SocialIcon({ platform }: { platform: SellerSocialPlatform }) {
  const paths: Record<SellerSocialPlatform, string> = {
    instagram: "M12 2.2c3.2 0 3.6 0 4.9.1 1.1.1 1.8.3 2.5.6a5 5 0 0 1 1.8 1.2 5 5 0 0 1 1.2 1.8c.3.7.5 1.4.6 2.5.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.1-.3 1.8-.6 2.5a5 5 0 0 1-1.2 1.8 5 5 0 0 1-1.8 1.2c-.7.3-1.4.5-2.5.6-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.1-.1-1.8-.3-2.5-.6a5 5 0 0 1-1.8-1.2 5 5 0 0 1-1.2-1.8c-.3-.7-.5-1.4-.6-2.5C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.1.3-1.8.6-2.5a5 5 0 0 1 1.2-1.8 5 5 0 0 1 1.8-1.2c.7-.3 1.4-.5 2.5-.6C8.4 2.2 8.8 2.2 12 2.2Zm0 2.2c-3.1 0-3.4 0-4.7.1-.9 0-1.4.2-1.8.3-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.1.4-.3.9-.3 1.8-.1 1.3-.1 1.6-.1 4.7s0 3.4.1 4.7c0 .9.2 1.4.3 1.8.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.1.9.3 1.8.3 1.3.1 1.6.1 4.7.1s3.4 0 4.7-.1c.9 0 1.4-.2 1.8-.3.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.1-.4.3-.9.3-1.8.1-1.3.1-1.6.1-4.7s0-3.4-.1-4.7c0-.9-.2-1.4-.3-1.8a2.8 2.8 0 0 0-.8-1.3c-.4-.4-.8-.6-1.3-.8-.4-.1-.9-.3-1.8-.3-1.3-.1-1.6-.1-4.7-.1Zm0 3.8A3.8 3.8 0 1 1 8.2 12 3.8 3.8 0 0 1 12 8.2Zm0 5.4A1.6 1.6 0 1 0 10.4 12 1.6 1.6 0 0 0 12 13.6Zm4.9-5.8a.9.9 0 1 1-.9-.9.9.9 0 0 1 .9.9Z",
    facebook: "M13.4 21v-7h2.4l.4-2.8h-2.8V9.4c0-.8.2-1.3 1.4-1.3h1.5V5.6c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 4v2h-2.5V14h2.5v7h3.2Z",
    tiktok: "M14.8 3c.3 1.9 1.4 3.5 3.2 4.4v2.4a7 7 0 0 1-3.2-.8V15a4.8 4.8 0 1 1-4.8-4.8c.3 0 .6 0 .9.1v2.5a2.5 2.5 0 1 0 1.6 2.3V3h2.3Z",
    youtube: "M21.8 8.5a3.2 3.2 0 0 0-2.2-2.2C17.7 5.8 12 5.8 12 5.8s-5.7 0-7.6.5A3.2 3.2 0 0 0 2.2 8.5 33 33 0 0 0 1.8 12c0 1.2.1 2.4.4 3.5a3.2 3.2 0 0 0 2.2 2.2c1.9.5 7.6.5 7.6.5s5.7 0 7.6-.5a3.2 3.2 0 0 0 2.2-2.2c.3-1.1.4-2.3.4-3.5s-.1-2.4-.4-3.5ZM10 15.1V8.9l5.2 3.1-5.2 3.1Z",
    telegram: "M20.9 4.6 3.6 11.2c-1.2.5-1.2 1.2-.2 1.5l4.4 1.4 1.7 5.2c.2.6.1.8.7.8.4 0 .5-.2.8-.5l2.4-2.3 4.9 3.6c.9.5 1.5.2 1.7-.8l3-14.1c.3-1.2-.4-1.8-1.5-1.4ZM9.5 13.8l8.6-5.4c.4-.2.8-.1.5.2l-7.1 6.4-.3 3.3-1.7-4.5Z",
    twitter: "M18.9 6.7c.8-.1 1.5-.4 2.1-.8-.3.8-.9 1.4-1.7 1.8.7 0 1.4-.3 2-.6-.5.7-1.1 1.3-1.8 1.8 0 .2 0 .5 0 .7 0 6.8-5.2 14.7-14.7 14.7-2.9 0-5.7-.9-8-2.3.4 0 .8.1 1.2.1 2.4 0 4.5-.8 6.2-2.2-2.2 0-4-1.5-4.7-3.5.3 0 .6.1.9.1.4 0 .9-.1 1.3-.2-2.3-.5-4-2.5-4-4.9v-.1c.7.4 1.5.6 2.3.7A5.2 5.2 0 0 1 3 7.2c0-1 .3-1.9.8-2.7a14.7 14.7 0 0 0 10.7 5.4 5.9 5.9 0 0 1-.1-1.2c0-2.8 2.3-5.1 5.1-5.1 1.5 0 2.8.6 3.7 1.6.9-.2 1.8-.5 2.6-1-.3 1-.9 1.8-1.7 2.3Z",
    whatsapp: "M20 3.9A10 10 0 0 0 4 17.5L2.6 22l4.7-1.3A10 10 0 1 0 20 3.9Zm-8 16.3c-1.5 0-3-.4-4.3-1.3l-.3-.2-2.8.8.8-2.7-.2-.3a7.7 7.7 0 1 1 6.8 3.7Zm4.3-5.8c-.2-.1-1.3-.7-1.5-.8-.2-.1-.4-.1-.5.1s-.6.8-.8.9c-.1.1-.3.2-.5 0a6.3 6.3 0 0 1-1.9-1.2 7 7 0 0 1-1.3-1.6c-.1-.2 0-.3.1-.5l.4-.4c.1-.1.2-.2.3-.4.1-.1.1-.3 0-.4 0-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.3.9 2.5c.1.1 1.6 2.5 3.9 3.4a8.4 8.4 0 0 0 1.3.5 3 3 0 0 0 1.4.1c.4-.1 1.3-.6 1.5-1.2.2-.6.2-1 .1-1.2 0-.1-.2-.2-.4-.3Z",
  };

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={paths[platform]} />
    </svg>
  );
}

export default function SellerStorefront({ sellerId, loggedIn, isOwner, initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState(initialData.filters.query);
  const [category, setCategory] = useState(initialData.filters.category);
  const [sort, setSort] = useState(initialData.filters.sort);
  const [minPrice, setMinPrice] = useState(
    initialData.filters.minPrice ? String(Math.floor(initialData.filters.minPrice / 100)) : "",
  );
  const [maxPrice, setMaxPrice] = useState(
    initialData.filters.maxPrice >= 100000000
      ? ""
      : String(Math.floor(initialData.filters.maxPrice / 100)),
  );
  const [page, setPage] = useState(initialData.pagination.page);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SellerProductCard | null>(null);
  const isFirstLoad = useRef(true);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams();

    if (deferredQuery.trim()) {
      params.set("q", deferredQuery.trim());
    }
    if (category && category !== "All") {
      params.set("category", category);
    }
    if (sort !== "newest") {
      params.set("sort", sort);
    }
    if (minPrice) {
      params.set("min", String(Math.max(0, Number(minPrice) * 100)));
    }
    if (maxPrice) {
      params.set("max", String(Math.max(0, Number(maxPrice) * 100)));
    }
    if (page > 1) {
      params.set("page", String(page));
    }

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState(null, "", nextUrl);

    async function load() {
      setLoading(true);
      const res = await fetch(`/api/sellers/${sellerId}?${params.toString()}`, {
        signal: controller.signal,
      });

      if (!res.ok) {
        setLoading(false);
        return;
      }

      const body = (await res.json()) as SellerStorefrontResponse;
      setData(body);
      setLoading(false);
    }

    load().catch(() => {
      setLoading(false);
    });

    return () => controller.abort();
  }, [category, deferredQuery, maxPrice, minPrice, page, sellerId, sort]);

  function changeFilter(next: Partial<{
    category: string;
    sort: SellerStorefrontResponse["filters"]["sort"];
    minPrice: string;
    maxPrice: string;
    query: string;
  }>) {
    if (typeof next.query === "string") {
      setQuery(next.query);
    }
    if (typeof next.category === "string") {
      setCategory(next.category);
    }
    if (typeof next.sort === "string") {
      setSort(next.sort);
    }
    if (typeof next.minPrice === "string") {
      setMinPrice(next.minPrice);
    }
    if (typeof next.maxPrice === "string") {
      setMaxPrice(next.maxPrice);
    }
    setPage(1);
  }

  return (
    <main className="page-wrap seller-storefront-page">
      <section className="seller-hero panel">
        <div className="seller-cover">
          {data.seller.coverImageUrl ? (
            <img src={data.seller.coverImageUrl} alt="" className="seller-cover-image" aria-hidden="true" />
          ) : null}
          <div className="seller-cover-overlay" />
          <div className="seller-hero-content">
            <div className="seller-avatar-wrap">
              {data.seller.avatarUrl ? (
                <img src={data.seller.avatarUrl} alt={data.seller.displayName} className="seller-avatar" />
              ) : (
                <div className="seller-avatar seller-avatar-fallback">{data.seller.displayName.slice(0, 1)}</div>
              )}
            </div>

            <div className="seller-identity">
              <div className="seller-title-row">
                <h1>{data.seller.displayName}</h1>
                {data.seller.isVerified ? <span className="seller-badge">Verified</span> : null}
              </div>
              <p>{data.seller.bio}</p>
              <div className="seller-meta-row">
                <span>{renderStars(data.seller.ratingAvg)} {data.seller.ratingAvg || 0}</span>
                <span>{data.seller.followersCount} followers</span>
                <span>{data.seller.productCount} products</span>
                <span>Joined {new Date(data.seller.joinDate).toLocaleDateString()}</span>
              </div>
              <div className="seller-social-row">
                {sellerSocialPlatforms
                  .filter((platform) => Boolean(data.seller.social[platform]))
                  .map((platform) => (
                    <a
                      key={platform}
                      href={data.seller.social[platform]}
                      target="_blank"
                      rel="noreferrer"
                      className="seller-social-link"
                      aria-label={`Open ${platformLabel(platform)}`}
                    >
                      <SocialIcon platform={platform} />
                    </a>
                  ))}
              </div>
            </div>

            {!isOwner ? (
              <div className="seller-action-row">
                <FollowButton
                  userId={sellerId}
                  loggedIn={loggedIn}
                  initialFollowing={data.seller.isFollowing}
                  className="seller-primary-btn"
                />
                <SellerMessageButton
                  recipientId={sellerId}
                  sellerId={sellerId}
                  loggedIn={loggedIn}
                />
              </div>
            ) : (
              <div className="seller-owner-note muted">
                Manage your storefront and social links from the seller tools page.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="seller-storefront-toolbar panel">
        <div className="seller-toolbar-copy">
          <h2>Storefront products</h2>
          <p>Filter and sort this seller&apos;s catalog like a modern marketplace store.</p>
        </div>
        <div className="seller-filter-grid">
          <input
            value={query}
            onChange={(event) => changeFilter({ query: event.target.value })}
            placeholder="Search products"
            aria-label="Search seller products"
          />
          <select
            value={category}
            onChange={(event) => changeFilter({ category: event.target.value })}
            aria-label="Filter by category"
          >
            <option value="All">All categories</option>
            {data.filters.availableCategories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => changeFilter({ sort: event.target.value as SellerStorefrontResponse["filters"]["sort"] })}
            aria-label="Sort seller products"
          >
            <option value="newest">Newest</option>
            <option value="popular">Popularity</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
          <input
            type="number"
            min="0"
            step="1"
            value={minPrice}
            onChange={(event) => changeFilter({ minPrice: event.target.value })}
            placeholder="Min $"
            aria-label="Minimum price"
          />
          <input
            type="number"
            min="0"
            step="1"
            value={maxPrice}
            onChange={(event) => changeFilter({ maxPrice: event.target.value })}
            placeholder="Max $"
            aria-label="Maximum price"
          />
        </div>
        <p className="muted seller-results-caption">
          {loading ? "Refreshing catalog..." : `${data.pagination.totalProducts} matching product(s)`}
        </p>
      </section>

      <section className="seller-products-grid">
        {data.products.length === 0 ? (
          <div className="panel seller-empty-state">
            <h3>No products found</h3>
            <p>Try a different category or search phrase.</p>
          </div>
        ) : (
          data.products.map((product) => (
            <article key={product.id} className="seller-product-card">
              <button
                type="button"
                className="seller-product-image-wrap"
                onClick={() => setSelectedProduct(product)}
              >
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.title} className="seller-product-image" />
                ) : (
                  <div className="seller-product-image seller-product-image--fallback">EasyBuy</div>
                )}
              </button>
              <div className="seller-product-body">
                <span className="seller-product-category">{product.category}</span>
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <div className="seller-product-rating">
                  <span>{renderStars(product.ratingAvg)}</span>
                  <span>{product.ratingCount ? `${product.ratingAvg} (${product.ratingCount})` : "No reviews yet"}</span>
                </div>
                <div className="seller-product-footer">
                  <span className="price">{formatPrice(product.priceCents)}</span>
                  <span className="muted">{product.stock} in stock</span>
                </div>
                <div className="seller-product-actions">
                  <PurchaseButton productId={product.id} canBuy={loggedIn} />
                  <button
                    type="button"
                    className="seller-secondary-btn"
                    onClick={() => setSelectedProduct(product)}
                  >
                    Quick view
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {data.pagination.pageCount > 1 ? (
        <section className="seller-pagination panel">
          <button
            type="button"
            className="seller-secondary-btn"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1 || loading}
          >
            Previous
          </button>
          <p>
            Page {data.pagination.page} of {data.pagination.pageCount}
          </p>
          <button
            type="button"
            className="seller-secondary-btn"
            onClick={() => setPage((value) => Math.min(data.pagination.pageCount, value + 1))}
            disabled={page === data.pagination.pageCount || loading}
          >
            Next
          </button>
        </section>
      ) : null}

      {selectedProduct ? (
        <div className="seller-dialog-backdrop" role="presentation" onClick={() => setSelectedProduct(null)}>
          <div className="seller-dialog seller-dialog--product" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="seller-dialog-head">
              <h3>{selectedProduct.title}</h3>
              <button type="button" className="seller-dialog-close" onClick={() => setSelectedProduct(null)}>
                Close
              </button>
            </div>
            <div className="seller-quick-view">
              {selectedProduct.imageUrl ? (
                <img src={selectedProduct.imageUrl} alt={selectedProduct.title} className="seller-quick-view-image" />
              ) : (
                <div className="seller-quick-view-image seller-product-image--fallback">EasyBuy</div>
              )}
              <div className="seller-quick-view-copy">
                <span className="seller-product-category">{selectedProduct.category}</span>
                <p>{selectedProduct.description}</p>
                <p className="price">{formatPrice(selectedProduct.priceCents)}</p>
                <p className="muted">{selectedProduct.stock} items available</p>
                <p className="muted">
                  {selectedProduct.ratingCount
                    ? `${renderStars(selectedProduct.ratingAvg)} ${selectedProduct.ratingAvg} from ${selectedProduct.ratingCount} review(s)`
                    : "No reviews yet."}
                </p>
                <PurchaseButton productId={selectedProduct.id} canBuy={loggedIn} />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}