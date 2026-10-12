// src/layout/SiteLayout.tsx

import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';

export default function SiteLayout() {
  const location = useLocation();

  return (
    <div className="site-layout">
      <Navbar />
      <main>
        <MotionConfig reducedMotion="user">
          <AnimatePresence mode="popLayout" initial={false}>
            <PageTransition key={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </MotionConfig>
      </main>
      <Footer />
    </div>
  );
}