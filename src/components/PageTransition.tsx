// src/components/PageTransition.tsx
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * ✅ Wave-Like Page Transition
 * - Page container: subtle fade
 * - Content children: staggered fade + rise (parang alon)
 * - Easing: quint-out (smooth, premium)
 */
export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={{
        width: '100%',
        willChange: 'opacity',
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * ✅ Wave Item — para sa bawat content na gusto mong "umahon"
 * Gamitin ito sa loob ng page para sa staggered wave effect
 */
export function WaveItem({
  children,
  index = 0,
  stagger = 0.06,
  duration = 0.5,
}: {
  children: ReactNode;
  index?: number;
  stagger?: number;
  duration?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration,
        delay: index * stagger,
        ease: [0.22, 1, 0.36, 1],   // ✅ Quint-out — smooth wave
      }}
      style={{
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </motion.div>
  );
}