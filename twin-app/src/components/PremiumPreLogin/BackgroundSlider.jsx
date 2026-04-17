import React from 'react';
import { motion } from 'framer-motion';
import './BackgroundSlider.css';

export default function BackgroundSlider({ slides, currentSlide }) {
  return (
    <div className="background-slider">
      {slides.map((slide, idx) => (
        <motion.div
          key={slide.id}
          className="slide-layer"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{
            opacity: idx === currentSlide ? 1 : 0,
            scale: idx === currentSlide ? 1 : 1.05,
          }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{
            opacity: { duration: 1.2, ease: 'easeInOut' },
            scale: { duration: 1.5, ease: 'easeOut' },
          }}
        >
          <div
            className="slide-gradient"
            style={{ background: slide.gradient }}
          />

          <svg
            className="slide-pattern"
            viewBox="0 0 1200 800"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              <pattern
                id={`pattern-${idx}`}
                x="0"
                y="0"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="30" cy="30" r="1" fill={slide.accentColor} opacity="0.15" />
                <path
                  d="M60 30 Q45 45 30 60 T0 60"
                  stroke={slide.accentColor}
                  strokeWidth="0.5"
                  fill="none"
                  opacity="0.1"
                />
              </pattern>
              <filter id={`glow-${idx}`}>
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <rect width="1200" height="800" fill={`url(#pattern-${idx})`} />

            <motion.circle
              cx="200"
              cy="150"
              r="80"
              fill={slide.accentColor}
              opacity="0.05"
              filter={`url(#glow-${idx})`}
              animate={{
                cx: [200, 250, 200],
                cy: [150, 200, 150],
              }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.circle
              cx="1000"
              cy="650"
              r="100"
              fill={slide.accentColor}
              opacity="0.04"
              filter={`url(#glow-${idx})`}
              animate={{
                cx: [1000, 950, 1000],
                cy: [650, 600, 650],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: 1,
              }}
            />
          </svg>

          <div className="slide-particles">
            {Array.from({ length: 15 }).map((_, i) => (
              <motion.div
                key={i}
                className="particle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  backgroundColor: slide.accentColor,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0, 0.6, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 1,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
        </motion.div>
      ))}

      <svg className="light-rays" viewBox="0 0 1200 800" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ray1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.02)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <motion.rect
          width="1200"
          height="800"
          fill="url(#ray1)"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  );
}
