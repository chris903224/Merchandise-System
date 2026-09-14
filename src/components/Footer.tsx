import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>© 2026 Saint Jude Catholic School</p>
        <nav className="site-footer__links" aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/catalog">Catalog</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Register</Link>
        </nav>
      </div>
    </footer>
  );
}
