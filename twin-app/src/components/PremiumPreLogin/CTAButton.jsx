import React from 'react';
import { motion } from 'framer-motion';
import './CTAButton.css';

export default function CTAButton({ onClick, accentColor }) {
  return (
    <motion.button
      className="premium-cta-button"
      onClick={onClick}
      style={{ '--accent-color': accentColor }}
      whileHover={{
        scale: 1.05,
        boxShadow: `0 0 40px ${accentColor}50, 0 0 20px ${accentColor}30`,
      }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 100,
        damping: 15,
      }}
    >
      <div className="cta-background" />

      <motion.div
        className="cta-glow-1"
        style={{ borderColor: accentColor }}
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="cta-glow-2"
        style={{ borderColor: accentColor }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="cta-content">
        <motion.span
          className="cta-label"
          animate={{ letterSpacing: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          Step Into Intelligence
        </motion.span>

        <motion.span
          className="cta-arrow"
          animate={{ x: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          →
        </motion.span>
      </div>

      <motion.div
        className="cta-shimmer"
        initial={{ x: '-100%', opacity: 0 }}
        whileHover={{ x: '100%', opacity: 1 }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  );
}
