// src/components/ScrollToTop.tsx
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ✅ Automatic scroll-to-top sa bawat route change
 * Ilagay sa loob ng <BrowserRouter> pero sa labas ng <Routes>
 */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // ✅ I-scroll sa taas — walang smooth, instant para hindi jarring
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' as ScrollBehavior,
    });
  }, [pathname, search]);

  return null;
}