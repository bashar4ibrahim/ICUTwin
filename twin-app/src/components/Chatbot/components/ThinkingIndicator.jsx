import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const phrases = [
  'Analyzing patient data...',
  'Processing clinical context...',
  'Generating insights...',
  'Consulting Digital Twin...',
];

const ThinkingIndicator = () => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPhraseIndex((index) => (index + 1) % phrases.length), 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}
    >
      <div
        style={{
          width: '36px',
          height: '36px',
          background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: '0.75rem',
          fontWeight: 700,
          letterSpacing: '0.08em',
        }}
      >
        AI
      </div>
      <div
        style={{
          padding: '0.75rem 1.25rem',
          background: 'rgba(244, 248, 252, 0.96)',
          border: '1px solid rgba(112, 159, 198, 0.18)',
          borderRadius: '24px',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
          boxShadow: '0 10px 22px rgba(18, 61, 96, 0.06)',
        }}
      >
        <div className="typing-wave">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#22455f',
            textShadow: 'none',
          }}
        >
          {phrases[phraseIndex]}
        </span>
      </div>
    </motion.div>
  );
};

export default ThinkingIndicator;
