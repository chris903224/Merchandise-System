// src/layout/SiteLayout.tsx

import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SiteLayout() {
  return (
    <div className="site-layout">      {/* ✅ IDINAGDAG — wrapper */}
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}