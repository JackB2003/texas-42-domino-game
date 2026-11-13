import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

/** A centered modal over a dimmer, matching the design's overlay styling. */
export function Modal({
  width,
  dim = 'rgba(8,20,15,.32)',
  borderColor = 'rgba(61,111,180,.5)',
  children,
  labelledBy,
}: {
  width: number;
  dim?: string;
  borderColor?: string;
  children: ReactNode;
  labelledBy?: string;
}): JSX.Element {
  return (
    <motion.div
      className="absolute inset-0 z-[60] flex items-center justify-center"
      style={{ background: dim }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        style={{
          width,
          background: 'linear-gradient(180deg,#241910,#170f08)',
          border: `1.5px solid ${borderColor}`,
          borderRadius: 18,
          padding: '28px 32px',
          boxShadow: '0 24px 60px rgba(0,0,0,.6)',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
