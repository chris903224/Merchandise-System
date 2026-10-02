// src/components/Footer.tsx

import { Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  MessageCircle,
  Store,
  PackageSearch,
  ShieldCheck,
  Mail,
  Phone,
  ArrowUp,
} from 'lucide-react';
import { useApp } from '../store';

/** Is the supply office open right now? (Mon–Fri, 8:00 AM – 5:00 PM, Manila time) */
function isOfficeOpen(): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(new Date());

  const day = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;

  const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day);
  return isWeekday && hour >= 8 && hour < 17;
}

const cat = (name: string) => `/catalog?category=${encodeURIComponent(name)}`;

export default function Footer() {
  const year = new Date().getFullYear();
  const { session } = useApp();
  const open = isOfficeOpen();

  const scrollTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        {/* ---------- CALL TO ACTION ---------- */}
        <section className="site-footer__cta" aria-label="Start shopping">
          <div className="site-footer__cta-copy">
            <h2>Reserve now, pick up without the queue.</h2>
            <p>Check live stock, choose your size, and collect at the supply office.</p>
          </div>
          <Link to="/catalog" className="site-footer__cta-btn">
            <Store className="react-icon" aria-hidden="true" />
            Browse catalog
          </Link>
        </section>

        {/* ---------- MAIN GRID ---------- */}
        <div className="site-footer__grid">
          {/* Brand */}
          <div className="site-footer__brand">
            <Link to="/" className="site-footer__logo" aria-label="SJCM Supply Office home">
              <span className="site-footer__logo-mark" aria-hidden="true">
                <Store className="react-icon" />
              </span>
              <span className="site-footer__logo-text">
                <strong>SJCM Supply Office</strong>
                <small>Campus merchandise pickup</small>
              </span>
            </Link>

            <p className="site-footer__tagline">
              Uniforms, organization apparel, and ID laces, reserved online and
              ready for pickup on campus.
            </p>

            <ul className="site-footer__badges">
              <li>
                <PackageSearch className="react-icon" aria-hidden="true" />
                <span>Live stock</span>
              </li>
              <li>
                <ShieldCheck className="react-icon" aria-hidden="true" />
                <span>Verified inventory</span>
              </li>
            </ul>
          </div>

          {/* Shop */}
          <nav className="site-footer__column" aria-label="Shop">
            <h3 className="site-footer__heading">Shop</h3>
            <ul className="site-footer__links">
              <li><Link to="/catalog">All merchandise</Link></li>
              <li><Link to={cat('School Uniform')}>School &amp; PE uniforms</Link></li>
              <li><Link to={cat('Org Uniform')}>Organization uniforms</Link></li>
              <li><Link to={cat('ID Lace')}>ID laces &amp; accessories</Link></li>
            </ul>
          </nav>

          {/* Account (depends on session) */}
          <nav className="site-footer__column" aria-label="Account">
            <h3 className="site-footer__heading">Account</h3>
            <ul className="site-footer__links">
              {session ? (
                <>
                  <li><Link to="/profile">My profile</Link></li>
                  <li><Link to="/dashboard">My orders</Link></li>
                  <li><Link to="/favorites">Favorites</Link></li>
                  <li><Link to="/cart">Cart</Link></li>
                  <li><Link to="/settings">Settings</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/login">Sign in</Link></li>
                  <li><Link to="/register">Create account</Link></li>
                  <li><Link to="/catalog">Browse catalog</Link></li>
                  <li><Link to="/cart">Cart</Link></li>
                </>
              )}
            </ul>
          </nav>

          {/* Visit us */}
          <div className="site-footer__column">
            <h3 className="site-footer__heading">Visit us</h3>
            <ul className="site-footer__contact">
              <li>
                <span className="site-footer__icon"><MapPin className="react-icon" aria-hidden="true" /></span>
                <span>Ground Floor, Main Building, SJCM Campus</span>
              </li>
              <li>
                <span className="site-footer__icon"><Clock className="react-icon" aria-hidden="true" /></span>
                <span>
                  Mon–Fri, 8:00 AM – 5:00 PM
                  <em className={`site-footer__status ${open ? 'is-open' : 'is-closed'}`}>
                    {open ? 'Open now' : 'Closed now'}
                  </em>
                </span>
              </li>
              <li>
                <span className="site-footer__icon"><MessageCircle className="react-icon" aria-hidden="true" /></span>
                <span>Message the supply office page</span>
              </li>
              <li>
                <span className="site-footer__icon"><Mail className="react-icon" aria-hidden="true" /></span>
                <a href="mailto:supply@sjmc.edu.ph">supply@sjmc.edu.ph</a>
              </li>
              <li>
                <span className="site-footer__icon"><Phone className="react-icon" aria-hidden="true" /></span>
                <a href="tel:+63281234567">(02) 8123-4567</a>
              </li>
            </ul>
          </div>
        </div>

        {/* ---------- BOTTOM BAR ---------- */}
        <div className="site-footer__bottom">
          <p className="site-footer__copy">
            © {year} Saint Jude Catholic School. All rights reserved.
          </p>

          <div className="site-footer__bottom-right">
            <nav className="site-footer__meta" aria-label="Footer meta navigation">
              {session ? (
                <>
                  <Link to="/settings">Settings</Link>
                  <Link to="/notifications">Notifications</Link>
                  <Link to="/profile">Profile</Link>
                </>
              ) : (
                <>
                  <Link to="/login">Sign in</Link>
                  <Link to="/register">Register</Link>
                </>
              )}
            </nav>

            <button
              type="button"
              className="site-footer__top"
              onClick={scrollTop}
              aria-label="Back to top"
            >
              <ArrowUp className="react-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}