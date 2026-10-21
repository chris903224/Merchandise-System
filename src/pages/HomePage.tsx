  // src/pages/HomePage.tsx

  import { useMemo, useState, useEffect, useRef } from 'react';
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
    Sparkles,
    X,
    Check,
  } from 'lucide-react';

  import { useApp, useProducts } from '../store';
  import type { UniformResponse } from '../services/onboarding';
  import ProductImage from '../components/ProductImage';
  import { formatPrice } from '../services';

  const HIDDEN_FROM_HERO_CAROUSEL: string[] = ['prod-1791456074389-cegm'];

  /* ============================================
    ✅ HOOK: Detect mobile
  ============================================ */
  function useIsMobile(breakpoint = 767) {
    const [isMobile, setIsMobile] = useState(
      typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
    );

    useEffect(() => {
      const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
      const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
      mq.addEventListener('change', handler);
      setIsMobile(mq.matches);
      return () => mq.removeEventListener('change', handler);
    }, [breakpoint]);

    return isMobile;
  }

  /* ============================================
    ✅ HOOK: Scroll-reveal via IntersectionObserver
  ============================================ */
  function useScrollReveal<T extends HTMLElement = HTMLElement>(
    options?: IntersectionObserverInit
  ) {
    const ref = useRef<T | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
      const el = ref.current;
      if (!el) return;

      if (
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        setIsVisible(true);
        return;
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '0px 0px -60px 0px',
          ...options,
        }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }, [options]);

    return { ref, isVisible };
  }

  /* ============================================
    ✅ COMPONENT: Welcome Uniform Modal
    ✅ YES/NO lang ang nag-se-save sa DB
    ✅ Kapag nag-skip (X, ESC, backdrop, refresh):
        → WALANG i-save → lalabas ulit sa next login
    ✅ Kapag nag-answer (Yes/No):
        → Naka-save sa DB → hindi na lalabas ulit
  ============================================ */
  function WelcomeUniformModal() {
    const { session, onboarding, isLoadingOnboarding, saveOnboarding } = useApp();

    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    /* ✅ Show modal kapag bagong account (walang onboarding record) */
    useEffect(() => {
      if (!session?.id) return;
      if (isLoadingOnboarding) return;

      /* ✅ Kung may record na sa DB (yes/no) → hindi na lalabas */
      if (onboarding) {
        setIsOpen(false);
        return;
      }

      /* ✅ Bagong account, walang record → lalabas pagkatapos ng delay */
      const timer = setTimeout(() => setIsOpen(true), 700);
      return () => clearTimeout(timer);
    }, [session?.id, onboarding, isLoadingOnboarding]);

    /* ============================================
      ✅ SAVE HANDLER — YES or NO lang (nag-save sa DB)
      ============================================ */
    const handleAnswer = async (response: UniformResponse) => {
      if (isSaving) return;

      setIsClosing(true);
      setIsSaving(true);

      try {
        await saveOnboarding(response);
        // ✅ Naka-save na sa DB → next login, hindi na lalabas
      } catch (error) {
        console.error('[WelcomeModal] Failed to save:', error);
      } finally {
        setIsSaving(false);
        setTimeout(() => {
          setIsOpen(false);
          setIsClosing(false);
        }, 350);
      }
    };

    /* ============================================
      ✅ SKIP HANDLER — X button, ESC, backdrop
      ✅ WALANG DB call → lalabas ulit sa next login
      ============================================ */
    const handleSkip = () => {
      if (isSaving) return;

      setIsClosing(true);
      // ✅ WALANG saveOnboarding() — skip lang
      setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 350);
    };

    /* ✅ ESC key + body scroll lock */
    useEffect(() => {
      if (!isOpen) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') handleSkip();
      };

      document.addEventListener('keydown', handleEscape);

      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = prevOverflow;
      };
    }, [isOpen]);

    /* ✅ WALANG beforeunload — kapag nag-refresh, walang i-save */

    if (!isOpen) return null;

    return (
      <div
        className={`welcome-uniform-modal ${isClosing ? 'is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-uniform-title"
        aria-describedby="welcome-uniform-desc"
        onClick={(e) => {
          /* ✅ Click sa backdrop = SKIP (walang save) */
          if (e.target === e.currentTarget) handleSkip();
        }}
      >
        <div className="welcome-uniform-modal__content">
          <button
            type="button"
            className="welcome-uniform-modal__close"
            onClick={handleSkip}
            aria-label="Close welcome dialog"
            disabled={isSaving}
          >
            <X className="react-icon" aria-hidden="true" />
          </button>

          <div className="welcome-uniform-modal__icon" aria-hidden="true">
            <Sparkles className="react-icon" />
          </div>

          <h3
            id="welcome-uniform-title"
            className="welcome-uniform-modal__title"
          >
            Do you already have your school uniform?
          </h3>

          <p
            id="welcome-uniform-desc"
            className="welcome-uniform-modal__desc"
          >
            Let us know so we can help you find the right items faster.
          </p>

          <div className="welcome-uniform-modal__actions">
            <button
              type="button"
              className="welcome-uniform-modal__btn welcome-uniform-modal__btn--primary"
              onClick={() => void handleAnswer('yes')}
              disabled={isSaving}
            >
              <Check className="react-icon" aria-hidden="true" />
              <span>{isSaving ? 'Saving…' : 'Yes, I have one'}</span>
            </button>

            <button
              type="button"
              className="welcome-uniform-modal__btn welcome-uniform-modal__btn--secondary"
              onClick={() => void handleAnswer('no')}
              disabled={isSaving}
            >
              <Shirt className="react-icon" aria-hidden="true" />
              <span>No, I need one</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================
    ✅ COMPONENT: Product Card with own reveal
  ============================================ */
  function ProductCard({
    product,
    index,
  }: {
    product: any;
    index: number;
  }) {
    const reveal = useScrollReveal<HTMLAnchorElement>();

    return (
      <Link
        ref={reveal.ref}
        to={`/products/${encodeURIComponent(product.id)}`}
        className={`home-card scroll-reveal__item ${
          reveal.isVisible ? 'is-visible' : ''
        }`}
        style={{ '--stagger-index': index } as React.CSSProperties}
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
            <p className="home-card__category">{product.category}</p>
          )}

          <p className="home-card__price">{formatPrice(product.price)}</p>

          <button type="button" className="home-card__cta" tabIndex={-1}>
            View
            <ArrowRight className="react-icon" aria-hidden="true" />
          </button>
        </div>
      </Link>
    );
  }

  /* ============================================
    ✅ COMPONENT: Category Card with own reveal
  ============================================ */
  function CategoryCard({
    to,
    icon: Icon,
    name,
    desc,
    index,
  }: {
    to: string;
    icon: typeof Package;
    name: string;
    desc: string;
    index: number;
  }) {
    const reveal = useScrollReveal<HTMLAnchorElement>();

    return (
      <Link
        ref={reveal.ref}
        to={to}
        className={`home-card home-card--category scroll-reveal__item ${
          reveal.isVisible ? 'is-visible' : ''
        }`}
        style={{ '--stagger-index': index } as React.CSSProperties}
      >
        <div className="home-card__media home-card__media--icon">
          <span className="home-card__icon-circle">
            <Icon className="react-icon" aria-hidden="true" />
          </span>
        </div>

        <div className="home-card__body">
          <h3 className="home-card__name">{name}</h3>
          <p className="home-card__category">{desc}</p>
          <button type="button" className="home-card__cta" tabIndex={-1}>
            Browse
            <ArrowRight className="react-icon" aria-hidden="true" />
          </button>
        </div>
      </Link>
    );
  }

  /* ============================================
    ✅ COMPONENT: Section Header with reveal
  ============================================ */
  function SectionHeader({
    kicker,
    title,
    description,
    linkTo,
    linkLabel,
    titleId,
  }: {
    kicker: string;
    title: string;
    description?: string;
    linkTo: string;
    linkLabel: string;
    titleId?: string;
  }) {
    const reveal = useScrollReveal<HTMLDivElement>();

    return (
      <div
        ref={reveal.ref}
        className={`home-section__header ${
          reveal.isVisible ? 'is-visible' : ''
        }`}
      >
        <div>
          <p className="home-section__kicker">{kicker}</p>
          <h2 id={titleId} className="home-section__title">
            {title}
          </h2>
          {description && (
            <p className="home-section__description">{description}</p>
          )}
        </div>

        <Link to={linkTo} className="home-section__link">
          {linkLabel}
          <ArrowUpRight className="react-icon" aria-hidden="true" />
        </Link>
      </div>
    );
  }

  /* ============================================
    ✅ COMPONENT: Visit Panel with reveal
  ============================================ */
  function VisitPanel() {
    const reveal = useScrollReveal<HTMLDivElement>();

    return (
      <div
        ref={reveal.ref}
        className={`home-highlights__panel visit-panel ${
          reveal.isVisible ? 'is-visible' : ''
        }`}
      >
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
            <span>Ground Floor, Main Building, SJCM Campus</span>
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
            <span>Questions? Message the supply office page.</span>
          </li>
        </ul>

        <Link to="/catalog" className="button button--secondary button--block">
          <Store className="react-icon" aria-hidden="true" />
          <span>Browse catalog</span>
        </Link>
      </div>
    );
  }

  /* ============================================
    ✅ COMPONENT: Best Finds Panel with reveal
  ============================================ */
  function BestFindsPanel({ bestFinds }: { bestFinds: any[] }) {
    const reveal = useScrollReveal<HTMLDivElement>();

    return (
      <div
        ref={reveal.ref}
        className={`home-highlights__panel ${
          reveal.isVisible ? 'is-visible' : ''
        }`}
      >
        <div className="home-section__header">
          <div>
            <p className="home-section__kicker">Popular right now</p>
            <h2 className="home-section__title">Best finds right now</h2>
          </div>

          <Link to="/catalog" className="home-section__link">
            See more
            <ArrowUpRight className="react-icon" aria-hidden="true" />
          </Link>
        </div>

        {bestFinds.length > 0 ? (
          <div className="home-cards home-cards--best">
            {bestFinds.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <p className="home-section__description">
            No items to highlight yet.
          </p>
        )}
      </div>
    );
  }

  export default function HomePage() {
    const { session } = useApp();
    const products = useProducts();
    const isMobile = useIsMobile(767);

    /* HERO CAROUSEL */
    const carouselProducts = useMemo(() => {
      return products
        .filter((p) => {
          if (HIDDEN_FROM_HERO_CAROUSEL.includes(p.id)) return false;
          if (!p.image || p.image.trim() === '') return false;
          if (Number(p.stock) <= 0) return false;
          return true;
        })
        .slice(0, 5);
    }, [products]);

    const [currentSlide, setCurrentSlide] = useState(0);
    const totalSlides = carouselProducts.length;
    const featuredProduct = carouselProducts[currentSlide] ?? null;

    const goNext = () => {
      if (totalSlides === 0) return;
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    };

    const goPrev = () => {
      if (totalSlides === 0) return;
      setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    /* NEW ARRIVALS — 5 items */
    const newArrivals = useMemo(() => products.slice(0, 5), [products]);

    const bestFinds = useMemo(() => {
      return [...products]
        .filter((product) => Number(product.stock) > 0)
        .sort((a, b) => Number(a.stock) - Number(b.stock))
        .slice(0, 3);
    }, [products]);

    /* =========================================================
      ✅ MOBILE VIEW
    ========================================================== */
    if (isMobile) {
      return (
        <main className="mobile-home">
          {/* ✅ WELCOME MODAL */}
          <WelcomeUniformModal />

          {/* MOBILE HERO */}
          <section className="mobile-hero">
            <div className="mobile-hero__bg" aria-hidden="true" />

            <div className="mobile-hero__content">
              <p className="mobile-hero__eyebrow">Official Merchandise</p>

              <h1 className="mobile-hero__title">
                Browse the
                <br />
                <em>Catalog</em>
              </h1>

              <p className="mobile-hero__desc">
                Official school uniforms, apparel, and organization
                merchandise for campus pickup.
              </p>

              <div className="mobile-hero__stats">
                <div className="mobile-hero__stat">
                  <ShieldCheck className="react-icon" />
                  <strong>Verified</strong>
                  <span>Inventory</span>
                </div>
                <div className="mobile-hero__stat">
                  <Package className="react-icon" />
                  <strong>Live</strong>
                  <span>Stock</span>
                </div>
                <div className="mobile-hero__stat">
                  <Timer className="react-icon" />
                  <strong>Skip</strong>
                  <span>The queue</span>
                </div>
              </div>

              <Link to="/catalog" className="mobile-hero__cta">
                <span>Browse catalog</span>
                <ArrowUpRight className="react-icon" />
              </Link>
            </div>
          </section>

          {/* CATEGORY CHIPS */}
          <div className="mobile-category-chips" role="list">
            <Link to="/catalog" className="mobile-category-chip">
              <Package className="react-icon" />
              <span>All items</span>
            </Link>
            <Link to="/catalog?search=Uniform" className="mobile-category-chip">
              <Shirt className="react-icon" />
              <span>Uniforms</span>
            </Link>
            <Link to="/catalog?search=ID%20Lace" className="mobile-category-chip">
              <Package className="react-icon" />
              <span>ID Lace</span>
            </Link>
            <Link to="/catalog?search=Organization" className="mobile-category-chip">
              <Shirt className="react-icon" />
              <span>Organization</span>
            </Link>
            <Link to="/catalog?search=PE" className="mobile-category-chip">
              <Shirt className="react-icon" />
              <span>PE Uniform</span>
            </Link>
          </div>

          {/* NEW ARRIVALS */}
          {newArrivals.length > 0 && (
            <section className="mobile-home-section">
              <div className="mobile-home-section__head">
                <div>
                  <p className="mobile-home-section__kicker">Fresh stock</p>
                  <h2 className="mobile-home-section__title">
                    New arrivals
                  </h2>
                </div>
                <Link to="/catalog" className="mobile-home-section__link">
                  View all
                  <ArrowRight className="react-icon" />
                </Link>
              </div>

              <div className="mobile-product-grid">
                {newArrivals.map((product) => {
                  const isOutOfStock = Number(product.stock) <= 0;
                  const isLowStock =
                    Number(product.stock) > 0 && Number(product.stock) <= 5;

                  return (
                    <Link
                      key={product.id}
                      to={`/products/${encodeURIComponent(product.id)}`}
                      className="mobile-product-card"
                    >
                      <div className="mobile-product-card__media">
                        <ProductImage
                          product={product}
                          className="mobile-product-card__image"
                          width={400}
                          height={400}
                        />
                        {isLowStock && (
                          <span className="mobile-product-card__badge is-low">
                            Low stock
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="mobile-product-card__badge is-out">
                            Out
                          </span>
                        )}
                      </div>

                      <div className="mobile-product-card__body">
                        <p className="mobile-product-card__name">
                          {product.name}
                        </p>

                        {product.category && (
                          <p className="mobile-product-card__category">
                            {product.category}
                          </p>
                        )}

                        <div className="mobile-product-card__footer">
                          <p className="mobile-product-card__price">
                            {formatPrice(product.price)}
                          </p>
                          {isOutOfStock && (
                            <span className="mobile-product-card__oos">
                              Out
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* CATEGORIES */}
          <section className="mobile-home-section">
            <div className="mobile-home-section__head">
              <div>
                <p className="mobile-home-section__kicker">Shop by need</p>
                <h2 className="mobile-home-section__title">
                  Official items
                </h2>
              </div>
              <Link to="/catalog" className="mobile-home-section__link">
                All
                <ArrowRight className="react-icon" />
              </Link>
            </div>

            <div className="mobile-category-cards">
              <Link
                to="/catalog?search=ID%20Lace"
                className="mobile-category-card"
              >
                <div className="mobile-category-card__icon">
                  <Package className="react-icon" />
                </div>
                <div className="mobile-category-card__copy">
                  <p className="mobile-category-card__name">
                    ID laces &amp; accessories
                  </p>
                  <p className="mobile-category-card__desc">
                    Lanyards, card holders, and clips.
                  </p>
                </div>
                <ChevronRight className="mobile-category-card__chev" />
              </Link>

              <Link
                to="/catalog?search=Organization"
                className="mobile-category-card"
              >
                <div className="mobile-category-card__icon">
                  <Shirt className="react-icon" />
                </div>
                <div className="mobile-category-card__copy">
                  <p className="mobile-category-card__name">
                    Organization uniforms
                  </p>
                  <p className="mobile-category-card__desc">
                    Department polos and council apparel.
                  </p>
                </div>
                <ChevronRight className="mobile-category-card__chev" />
              </Link>

              <Link
                to="/catalog?search=Uniform"
                className="mobile-category-card"
              >
                <div className="mobile-category-card__icon">
                  <Shirt className="react-icon" />
                </div>
                <div className="mobile-category-card__copy">
                  <p className="mobile-category-card__name">
                    School &amp; PE uniforms
                  </p>
                  <p className="mobile-category-card__desc">
                    Campus uniforms, PE shirts, joggers.
                  </p>
                </div>
                <ChevronRight className="mobile-category-card__chev" />
              </Link>
            </div>
          </section>

          {/* BEST FINDS */}
          {bestFinds.length > 0 && (
            <section className="mobile-home-section">
              <div className="mobile-home-section__head">
                <div>
                  <p className="mobile-home-section__kicker">
                    Popular right now
                  </p>
                  <h2 className="mobile-home-section__title">
                    Best finds
                  </h2>
                </div>
                <Link to="/catalog" className="mobile-home-section__link">
                  See more
                  <ArrowRight className="react-icon" />
                </Link>
              </div>

              <div className="mobile-product-grid">
                {bestFinds.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${encodeURIComponent(product.id)}`}
                    className="mobile-product-card"
                  >
                    <div className="mobile-product-card__media">
                      <ProductImage
                        product={product}
                        className="mobile-product-card__image"
                        width={400}
                        height={400}
                      />
                    </div>
                    <div className="mobile-product-card__body">
                      {product.category && (
                        <p className="mobile-product-card__category">
                          {product.category}
                        </p>
                      )}
                      <p className="mobile-product-card__name">
                        {product.name}
                      </p>
                      <p className="mobile-product-card__price">
                        From {formatPrice(product.price)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* VISIT US */}
          <section className="mobile-home-section mobile-visit-card">
            <div className="mobile-visit-card__head">
              <p className="mobile-home-section__kicker">Visit us</p>
              <h2 className="mobile-home-section__title">
                SJCM Supply Office
              </h2>
            </div>

            <ul className="mobile-visit-list">
              <li>
                <span className="mobile-visit-list__icon">
                  <MapPin className="react-icon" />
                </span>
                <span>
                  Ground Floor, Main Building, SJCM Campus
                </span>
              </li>

              <li>
                <span className="mobile-visit-list__icon">
                  <Clock className="react-icon" />
                </span>
                <span>Mon–Fri, 8:00 AM – 5:00 PM</span>
              </li>

              <li>
                <span className="mobile-visit-list__icon">
                  <MessageCircle className="react-icon" />
                </span>
                <span>
                  Questions? Message the supply office page.
                </span>
              </li>
            </ul>

            <Link to="/catalog" className="mobile-hero__cta">
              <Store className="react-icon" />
              <span>Browse catalog</span>
            </Link>
          </section>
        </main>
      );
    }

    /* =========================================================
      ✅ DESKTOP VIEW
    ========================================================== */
    return (
      <>
        {/* ✅ WELCOME MODAL — desktop */}
        <WelcomeUniformModal />

        <main className="page-shell hero-shell">
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

        {/* NEWEST ARRIVALS */}
        {newArrivals.length > 0 && (
          <section
            className="page-shell home-section"
            aria-labelledby="arrivals-title"
          >
            <SectionHeader
              kicker="Fresh stock"
              title="Newest arrivals this week"
              description="Recently restocked uniforms, apparel, and laces — ready to reserve today."
              linkTo="/catalog"
              linkLabel="View all"
              titleId="arrivals-title"
            />

            <div className="home-cards">
              {newArrivals.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* OFFICIAL ITEMS */}
        <section
          className="page-shell home-section"
          aria-labelledby="category-title"
        >
          <SectionHeader
            kicker="Shop by need"
            title="Official items, ready for pickup"
            description="Find the right school or organization item without the campus queue."
            linkTo="/catalog"
            linkLabel="All merchandise"
            titleId="category-title"
          />

          <div className="home-cards">
            <CategoryCard
              to="/catalog?search=ID%20Lace"
              icon={Package}
              name="ID laces & accessories"
              desc="Official lanyards, card holders, and clips."
              index={0}
            />

            <CategoryCard
              to="/catalog?search=Organization"
              icon={Shirt}
              name="Organization uniforms"
              desc="Department polos and council apparel."
              index={1}
            />

            <CategoryCard
              to="/catalog?search=Uniform"
              icon={Shirt}
              name="School & PE uniforms"
              desc="Campus uniforms, PE shirts, and joggers."
              index={2}
            />
          </div>
        </section>

        {/* BEST FINDS + VISIT */}
        <section
          className="page-shell home-section"
          aria-label="Best finds and store information"
        >
          <div className="home-highlights__grid">
            <BestFindsPanel bestFinds={bestFinds} />
            <VisitPanel />
          </div>
        </section>
      </>
    );
  }