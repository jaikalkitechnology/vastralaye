import { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface RevealProps {
  children: ReactNode;
  /** Seconds to wait before starting — use i * 0.06–0.1 to stagger siblings. */
  delay?: number;
  /** Rise distance in px (design.md §7: subtle, 12–20px). */
  y?: number;
  className?: string;
  /** Animate only the first time it enters the viewport (default true). */
  once?: boolean;
}

/**
 * Scroll reveal per design.md §7 — fade + gentle rise, ease-out, fired
 * once when the block enters the viewport. Renders a plain div when the
 * visitor prefers reduced motion.
 */
const Reveal = ({ children, delay = 0, y = 18, className, once = true }: RevealProps) => {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.15, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 0.61, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
};

export default Reveal;
