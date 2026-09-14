import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  LogIn,
  PackageSearch,
  ShieldCheck,
  Store,
  Timer,
  Clock,
  MapPin,
  MessageCircle,
  Badge,
  Shirt,
} from 'lucide-react';

import { useProducts } from '../store';
import ProductImage from '../components/ProductImage';
import { formatPrice } from '../services';

export default function HomePage() {
  const products = useProducts();

  // Featured product used only as the hero visual.
  const featuredProduct = products[0] ?? null;

  // New arrivals — first 6 products.
  const newArrivals = useMemo(
    () => products.slice(0, 6),
    [products]
  );

  // Best finds — lowest-stock items that are still available.
  const bestFinds = useMemo(() => {
    return [...products]
      .filter((product) => Number(product.stock) > 0)
      .sort((a, b) => Number(a.stock) - Number(b.stock))
      .slice(0, 3);
  }, [products]);

  return (
    <>
      {/* =========================================================
          HERO SECTION
          Split layout: content on the left / image on the right
      ========================================================== */}
      <main className="page-shell hero-shell">
        {/* LEFT — HERO CONTENT */}
        <div className="hero-copy">
          <p className="queue-badge">
            <span aria-hidden="true">●</span>
            Virtual queue active
          </p>

          <h1 id="hero-title" className="hero-title">
            Reserve today.{' '}
            <span>Pick up on campus.</span>
          </h1>

          <p className="hero-lede">
            Check live stock for uniforms, organization apparel, and ID
            laces. Reserve what you need online, then collect it from the
            SJCM supply office without waiting in line.
          </p>

          <div className="hero-actions">
            <Link
              to="/catalog"
              className="button button--primary button--pill"
            >
              <Store className="react-icon" aria-hidden="true" />
              <span>Browse catalog</span>
              <ArrowUpRight className="react-icon" aria-hidden="true" />
            </Link>

            <Link
              to="/login"
              className="button button--secondary button--pill"
            >
              <LogIn className="react-icon" aria-hidden="true" />
              <span>Sign in to reserve</span>
            </Link>
          </div>

          <div className="hero-divider" />

          <ul className="hero-bullets">
            <li className="hero-bullet">
              <span className="hero-bullet__icon">
                <PackageSearch
                  className="react-icon"
                  aria-hidden="true"
                />
              </span>

              <span>
                <strong>Live stock</strong>
                <small>Updated daily</small>
              </span>
            </li>

            <li className="hero-bullet">
              <span className="hero-bullet__icon">
                <ShieldCheck
                  className="react-icon"
                  aria-hidden="true"
                />
              </span>

              <span>
                <strong>Verified inventory</strong>
                <small>Trusted &amp; accurate</small>
              </span>
            </li>

            <li className="hero-bullet">
              <span className="hero-bullet__icon">
                <Timer
                  className="react-icon"
                  aria-hidden="true"
                />
              </span>

              <span>
                <strong>Skip the queue</strong>
                <small>Reserve online, pick up onsite</small>
              </span>
            </li>
          </ul>
        </div>

        {/* =========================================================
            RIGHT — HERO IMAGE
            Clean image only. No text / badge / overlay.
        ========================================================== */}
        <aside
          className="hero-photo"
          aria-label="Featured campus merchandise"
        >
          {featuredProduct ? (
            <div className="hero-photo__frame">
              <ProductImage
                product={featuredProduct}
                className="hero-photo__image"
                width={760}
                height={760}
              />
            </div>
          ) : (
            <div className="hero-photo__empty">
              <div className="empty-state">
                <PackageSearch
                  className="react-icon"
                  aria-hidden="true"
                />

                <p className="empty-state__title">
                  Inventory is not available
                </p>

                <p className="empty-state__description">
                  Please check back once the store ledger is connected.
                </p>
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* =========================================================
          FRESH STOCK
      ========================================================== */}
      {newArrivals.length > 0 && (
        <section
          className="page-shell arrivals-section"
          aria-labelledby="arrivals-title"
        >
          <div className="arrivals-section__header">
            <div>
              <p className="section-kicker">Fresh stock</p>

              <h2
                id="arrivals-title"
                className="section-title"
              >
                Newest arrivals this week
              </h2>

              <p className="section-description">
                Recently restocked uniforms, apparel, and laces —
                ready to reserve today.
              </p>
            </div>

            <Link to="/catalog" className="text-link">
              View all
              <ArrowUpRight
                className="react-icon"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="arrivals-grid">
            {newArrivals.map((product) => (
              <Link
                key={product.id}
                to={`/products/${encodeURIComponent(product.id)}`}
                className="arrival-card glass-card-hover"
              >
                <div className="arrival-card__media">
                  <ProductImage
                    product={product}
                    className="arrival-card__image"
                    width={220}
                    height={220}
                  />
                </div>

                <p className="arrival-card__name">
                  {product.name}
                </p>

                <p className="arrival-card__price">
                  {formatPrice(product.price)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================
          CATEGORY SECTION
      ========================================================== */}
      <section
        className="page-shell category-section"
        aria-labelledby="category-title"
      >
        <div className="category-section__header">
          <div>
            <p className="section-kicker">Shop by need</p>

            <h2
              id="category-title"
              className="section-title"
            >
              Official items, ready for pickup
            </h2>

            <p className="section-description">
              Find the right school or organization item without the
              campus queue.
            </p>
          </div>

          <Link to="/catalog" className="text-link">
            All merchandise
            <ArrowUpRight
              className="react-icon"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="category-grid">
          <Link
            to="/catalog?category=ID Lace"
            className="category-card glass-card-hover"
          >
            <div className="category-card__top">
              <span className="category-card__icon">
                <Badge
                  className="react-icon"
                  aria-hidden="true"
                />
              </span>

              <ArrowUpRight
                className="react-icon"
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="category-card__title">
                ID laces &amp; accessories
              </h3>

              <p className="category-card__description">
                Official lanyards, card holders, and clips.
              </p>
            </div>
          </Link>

          <Link
            to="/catalog?category=Org Uniform"
            className="category-card glass-card-hover"
          >
            <div className="category-card__top">
              <span className="category-card__icon">
                <Shirt
                  className="react-icon"
                  aria-hidden="true"
                />
              </span>

              <ArrowUpRight
                className="react-icon"
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="category-card__title">
                Organization uniforms
              </h3>

              <p className="category-card__description">
                Department polos and council apparel.
              </p>
            </div>
          </Link>

          <Link
            to="/catalog?category=School Uniform"
            className="category-card glass-card-hover"
          >
            <div className="category-card__top">
              <span className="category-card__icon">
                <Shirt
                  className="react-icon"
                  aria-hidden="true"
                />
              </span>

              <ArrowUpRight
                className="react-icon"
                aria-hidden="true"
              />
            </div>

            <div>
              <h3 className="category-card__title">
                School &amp; PE uniforms
              </h3>

              <p className="category-card__description">
                Campus uniforms, PE shirts, and joggers.
              </p>
            </div>
          </Link>
        </div>
      </section>

      {/* =========================================================
          BEST FINDS + VISIT US
      ========================================================== */}
      <section
        className="page-shell home-highlights"
        aria-label="Best finds and store information"
      >
        <div className="home-highlights__grid">
          {/* BEST FINDS */}
          <div className="panel home-highlights__panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">
                  Popular right now
                </p>

                <h2 className="panel-heading__title">
                  Best finds right now
                </h2>
              </div>

              <Link to="/catalog" className="text-link">
                See more
                <ArrowUpRight
                  className="react-icon"
                  aria-hidden="true"
                />
              </Link>
            </div>

            {bestFinds.length > 0 ? (
              <div className="best-finds-grid">
                {bestFinds.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${encodeURIComponent(product.id)}`}
                    className="best-find-card glass-card-hover"
                  >
                    <div className="best-find-card__media">
                      <ProductImage
                        product={product}
                        className="best-find-card__image"
                        width={200}
                        height={200}
                      />
                    </div>

                    <p className="best-find-card__meta">
                      {product.category}
                    </p>

                    <p className="best-find-card__name">
                      {product.name}
                    </p>

                    <p className="best-find-card__price">
                      From {formatPrice(product.price)}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="section-description">
                No items to highlight yet.
              </p>
            )}
          </div>

          {/* VISIT US */}
          <div className="panel home-highlights__panel visit-panel">
            <div className="panel-heading">
              <div>
                <p className="section-kicker">Visit us</p>

                <h2 className="panel-heading__title">
                  SJCM Supply Office
                </h2>
              </div>
            </div>

            <ul className="visit-panel__list">
              <li>
                <span className="visit-panel__icon">
                  <MapPin
                    className="react-icon"
                    aria-hidden="true"
                  />
                </span>

                <span>
                  Ground Floor, Main Building, SJCM Campus
                </span>
              </li>

              <li>
                <span className="visit-panel__icon">
                  <Clock
                    className="react-icon"
                    aria-hidden="true"
                  />
                </span>

                <span>
                  Mon–Fri, 8:00 AM – 5:00 PM
                </span>
              </li>

              <li>
                <span className="visit-panel__icon">
                  <MessageCircle
                    className="react-icon"
                    aria-hidden="true"
                  />
                </span>

                <span>
                  Questions? Message the supply office page.
                </span>
              </li>
            </ul>

            <Link
              to="/catalog"
              className="button button--secondary button--block"
            >
              <Store
                className="react-icon"
                aria-hidden="true"
              />

              <span>Browse catalog</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}