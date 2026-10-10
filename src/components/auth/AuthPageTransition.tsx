// src/components/auth/AuthPageTransition.tsx

import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

/* ============================================
   ✅ PAGE-LEVEL VARIANTS — BALANCED
   Walang blur/scale para pantay ang timing
   sa LAHAT ng direksyon
============================================ */
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.34,
      ease: [0.22, 1, 0.36, 1], // smooth out-expo
      when: 'beforeChildren',
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 0.6, 1], // ease-in-out (hindi harsh)
    },
  },
};

/* ============================================
   ✅ CHILD VARIANTS — subtle stagger
============================================ */
export const childVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ============================================
   ✅ MAIN COMPONENT
============================================ */
export default function AuthPageTransition({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        width: '100%',
        minHeight: '100vh',
        /* ✅ GPU hint lang — walang filter kaya walang asymmetric lag */
        willChange: 'opacity, transform',
      }}
      className="auth-page-transition"
    >
      {children}
    </motion.div>
  );
}