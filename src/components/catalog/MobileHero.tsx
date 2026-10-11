// src/components/home/MobileHero.tsx
// ✅ TikTok Shop style hero card

import { Link } from 'react-router-dom';
import {
  ArrowUpRight,
  Package,
  ShieldCheck,
  Timer,
} from 'lucide-react';

export default function MobileHero() {
  return (
    <section className="mobile-hero">
      {/* Background image overlay */}
      <div className="mobile-hero__bg" aria-hidden="true" />

      <div className="mobile-hero__content">
        <p className="mobile-hero__eyebrow">Official Merchandise</p>

        <h1 className="mobile-hero__title">
          Browse the
          <br />
          <em>Catalog</em>
        </h1>

        <p className="mobile-hero__desc">
          Official school uniforms, apparel, and organization merchandise
          for campus pickup.
        </p>

        {/* Stats row */}
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
  );
}