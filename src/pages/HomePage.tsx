// src/pages/HomePage.tsx

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  ArrowRight,
  LogIn,
  PackageSearch,
  ShieldCheck,
  Store,
  Timer,
  Clock,
  MapPin,
  MessageCircle,
  Shirt,
  Package,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

import { useApp, useProducts } from '../store';
import ProductImage from '../components/ProductImage';
import { formatPrice } from '../services';


const HIDDEN_FROM_HERO_CAROUSEL: string[] = [
    'prod-1791456074389-cegm',      
  
]
export default function HomePage() {
  const { session } = useApp();
  const products = useProducts();

  /* =========================================================
     HERO CAROUSEL — dynamic from products
     ✅ Filter: products na may image, may stock, at HINDI hidden
     ✅ Show max 5 slides 
  ========================================================== */
  const carouselProducts = useMemo(() => {
    return products
      .filter((p) => {
        // ✅ Skip kung nasa hidden list (hero carousel only)
        if (HIDDEN_FROM_HERO_CAROUSEL.includes(p.id)) return false;
        // ✅ Skip kung walang image o walang stock
        if (!p.image || p.image.trim() === '') return false;
        if (Number(p.stock) <= 0) return false;
        return true;
      })
      .slice(0, 5);
  }, [products]);

  const [currentSlide, setCurrentSlide] = useState(0);

  /* Total slides */
  const totalSlides = carouselProducts.length;
  const featuredProduct = carouselProducts[currentSlide] ?? null;

  /* Prev / Next handlers — wrap around */
  const goNext = () => {
    if (totalSlides === 0) return;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const goPrev = () => {
    if (totalSlides === 0) return;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  /* New arrivals — first 6 products */
  const newArrivals = useMemo(() => products.slice(0, 6), [products]);

  /* Best finds — lowest-stock items that are still available */
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

            {session ? (
              <Link
                to="/dashboard"
                className="button button--secondary button--pill"
              >
                <Package className="react-icon" aria-hidden="true" />
                <span>My orders</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="button button--secondary button--pill"
              >
                <LogIn className="react-icon" aria-hidden="true" />
                <span>Sign in to reserve</span>
              </Link>
            )}
          </div>

          <div className="hero-divider" />

          <ul className="hero-bullets">
            <li className="hero-bullet">
              <span className="hero-bullet__icon">
                <PackageSearch className="react-icon" aria-hidden="true" />
              </span>
              <span>
                <strong>Live stock</strong>
                <small>Updated daily</small>
              </span>
            </li>

            <li className="hero-bullet">
              <span className="hero-bullet__icon">
                <ShieldCheck className="react-icon" aria-hidden="true" />
              </span>
              <span>
                <strong>Verified inventory</strong>
                <small>Trusted &amp; accurate</small>
              </span>
            </li>

            <li className="hero-bullet">
              <span className="hero-bullet__icon">
                <Timer className="react-icon" aria-hidden="true" />
              </span>
              <span>
                <strong>Skip the queue</strong>
                <small>Reserve online, pick up onsite</small>
              </span>
            </li>
          </ul>
        </div>

        {/* =========================================================
            RIGHT — HERO CAROUSEL
        ========================================================== */}
        <aside
          className="hero-photo hero-carousel"
          aria-label="Featured campus merchandise"
        >
          {featuredProduct ? (
            <>
              <div className="hero-carousel__viewport">
                <div className="hero-photo__frame hero-carousel__frame">
                  <ProductImage
                    key={featuredProduct.id}
                    product={featuredProduct}
                    className="hero-photo__image hero-carousel__image"
                    width={760}
                    height={760}
                  />

                  {/* ✅ Product info overlay */}
                  <div className="hero-carousel__caption">
                    <p className="hero-carousel__name">
                      {featuredProduct.name}
                    </p>
                    {featuredProduct.category && (
                      <p className="hero-carousel__meta">
                        {featuredProduct.category}
                        {featuredProduct.organization &&
                          ` · ${featuredProduct.organization}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ✅ Prev / Next buttons */}
              {totalSlides > 1 && (
                <>
                  <button
                    type="button"
                    className="hero-carousel__btn hero-carousel__btn--prev"
                    onClick={goPrev}
                    aria-label="Previous product"
                  >
                    <ChevronLeft className="react-icon" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="hero-carousel__btn hero-carousel__btn--next"
                    onClick={goNext}
                    aria-label="Next product"
                  >
                    <ChevronRight className="react-icon" aria-hidden="true" />
                  </button>

                  {/* ✅ Dots indicator */}
                  <div
                    className="hero-carousel__dots"
                    role="tablist"
                    aria-label="Carousel navigation"
                  >
                    {carouselProducts.map((p, index) => (
                      <button
                        key={p.id}
                        type="button"
                        role="tab"
                        aria-selected={index === currentSlide}
                        className={`hero-carousel__dot ${
                          index === currentSlide ? 'is-active' : ''
                        }`}
                        onClick={() => setCurrentSlide(index)}
                        aria-label={`Go to slide ${index + 1}: ${p.name}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="hero-photo__empty">
              <div className="empty-state">
                <PackageSearch className="react-icon" aria-hidden="true" />
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
          FRESH STOCK — Newest arrivals
      ========================================================== */}
      {newArrivals.length > 0 && (
        <section
          className="page-shell home-section"
          aria-labelledby="arrivals-title"
        >
          <div className="home-section__header">
            <div>
              <p className="home-section__kicker">Fresh stock</p>
              <h2 id="arrivals-title" className="home-section__title">
                Newest arrivals this week
              </h2>
              <p className="home-section__description">
                Recently restocked uniforms, apparel, and laces —
                ready to reserve today.
              </p>
            </div>

            <Link to="/catalog" className="home-section__link">
              View all
              <ArrowUpRight className="react-icon" aria-hidden="true" />
            </Link>
          </div>

          <div className="home-cards">
            {newArrivals.map((product) => (
              <Link
                key={product.id}
                to={`/products/${encodeURIComponent(product.id)}`}
                className="home-card"
              >
                <div className="home-card__media">
                  <ProductImage
                    product={product}
                    className="home-card__image"
                    width={260}
                    height={320}
                  />
                  {Number(product.stock) > 0 && Number(product.stock) <= 5 && (
                    <span className="home-card__badge">Low stock</span>
                  )}
                </div>

                <div className="home-card__body">
                  <h3 className="home-card__name">{product.name}</h3>

                  {product.category && (
                    <p className="home-card__category">
                      {product.category}
                    </p>
                  )}

                  <p className="home-card__price">
                    {formatPrice(product.price)}
                  </p>

                  <button
                    type="button"
                    className="home-card__cta"
                    tabIndex={-1}
                  >
                    View
                    <ArrowRight
                      className="react-icon"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* =========================================================
          CATEGORY SECTION — Working filters
      ========================================================== */}
      <section
        className="page-shell home-section"
        aria-labelledby="category-title"
      >
        <div className="home-section__header">
          <div>
            <p className="home-section__kicker">Shop by need</p>
            <h2 id="category-title" className="home-section__title">
              Official items, ready for pickup
            </h2>
            <p className="home-section__description">
              Find the right school or organization item without the
              campus queue.
            </p>
          </div>

          <Link to="/catalog" className="home-section__link">
            All merchandise
            <ArrowUpRight className="react-icon" aria-hidden="true" />
          </Link>
        </div>

        <div className="home-cards">
          {/* ✅ ID LACES */}
          <Link
            to="/catalog?search=ID%20Lace"
            className="home-card home-card--category"
          >
            <div className="home-card__media home-card__media--icon">
              <span className="home-card__icon-circle">
                <Package className="react-icon" aria-hidden="true" />
              </span>
            </div>

            <div className="home-card__body">
              <h3 className="home-card__name">
                ID laces &amp; accessories
              </h3>
              <p className="home-card__category">
                Official lanyards, card holders, and clips.
              </p>
              <button
                type="button"
                className="home-card__cta"
                tabIndex={-1}
              >
                Browse
                <ArrowRight
                  className="react-icon"
                  aria-hidden="true"
                />
              </button>
            </div>
          </Link>

          {/* ✅ ORGANIZATION UNIFORMS */}
          <Link
            to="/catalog?search=Organization"
            className="home-card home-card--category"
          >
            <div className="home-card__media home-card__media--icon">
              <span className="home-card__icon-circle">
                <Shirt className="react-icon" aria-hidden="true" />
              </span>
            </div>

            <div className="home-card__body">
              <h3 className="home-card__name">
                Organization uniforms
              </h3>
              <p className="home-card__category">
                Department polos and council apparel.
              </p>
              <button
                type="button"
                className="home-card__cta"
                tabIndex={-1}
              >
                Browse
                <ArrowRight
                  className="react-icon"
                  aria-hidden="true"
                />
              </button>
            </div>
          </Link>

          {/* ✅ SCHOOL & PE UNIFORMS */}
          <Link
            to="/catalog?search=Uniform"
            className="home-card home-card--category"
          >
            <div className="home-card__media home-card__media--icon">
              <span className="home-card__icon-circle">
                <Shirt className="react-icon" aria-hidden="true" />
              </span>
            </div>

            <div className="home-card__body">
              <h3 className="home-card__name">
                School &amp; PE uniforms
              </h3>
              <p className="home-card__category">
                Campus uniforms, PE shirts, and joggers.
              </p>
              <button
                type="button"
                className="home-card__cta"
                tabIndex={-1}
              >
                Browse
                <ArrowRight
                  className="react-icon"
                  aria-hidden="true"
                />
              </button>
            </div>
          </Link>
        </div>
      </section>

      {/* =========================================================
          BEST FINDS + VISIT US
      ========================================================== */}
      <section
        className="page-shell home-section"
        aria-label="Best finds and store information"
      >
        <div className="home-highlights__grid">
          <div className="home-highlights__panel">
            <div className="home-section__header">
              <div>
                <p className="home-section__kicker">Popular right now</p>
                <h2 className="home-section__title">
                  Best finds right now
                </h2>
              </div>

              <Link to="/catalog" className="home-section__link">
                See more
                <ArrowUpRight className="react-icon" aria-hidden="true" />
              </Link>
            </div>

            {bestFinds.length > 0 ? (
              <div className="home-cards home-cards--best">
                {bestFinds.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${encodeURIComponent(product.id)}`}
                    className="home-card"
                  >
                    <div className="home-card__media">
                      <ProductImage
                        product={product}
                        className="home-card__image"
                        width={240}
                        height={300}
                      />
                    </div>

                    <div className="home-card__body">
                      {product.category && (
                        <p className="home-card__category">
                          {product.category}
                        </p>
                      )}
                      <h3 className="home-card__name">
                        {product.name}
                      </h3>
                      <p className="home-card__price">
                        From {formatPrice(product.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="home-section__description">
                No items to highlight yet.
              </p>
            )}
          </div>

          <div className="home-highlights__panel visit-panel">
            <div className="home-section__header">
              <div>
                <p className="home-section__kicker">Visit us</p>
                <h2 className="home-section__title">SJCM Supply Office</h2>
              </div>
            </div>

            <ul className="visit-panel__list">
              <li>
                <span className="visit-panel__icon">
                  <MapPin className="react-icon" aria-hidden="true" />
                </span>
                <span>
                  Ground Floor, Main Building, SJCM Campus
                </span>
              </li>

              <li>
                <span className="visit-panel__icon">
                  <Clock className="react-icon" aria-hidden="true" />
                </span>
                <span>Mon–Fri, 8:00 AM – 5:00 PM</span>
              </li>

              <li>
                <span className="visit-panel__icon">
                  <MessageCircle className="react-icon" aria-hidden="true" />
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
              <Store className="react-icon" aria-hidden="true" />
              <span>Browse catalog</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}