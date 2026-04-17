import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import BackgroundSlider from './BackgroundSlider';
import SlideContent from './SlideContent';
import CTAButton from './CTAButton';
import './PremiumPreLogin.css';

const SLIDES = [
  {
    id: 1,
    title: 'Intelligent Clinical Monitoring',
    subtitle: 'Real-time AI-powered patient insights',
    description: 'Step into the future of ICU management where artificial intelligence meets compassionate care',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #1e3a53 100%)',
    accentColor: '#14b8a6',
  },
  {
    id: 2,
    title: 'Predictive Intelligence',
    subtitle: 'Anticipate patient risks before they emerge',
    description: 'Advanced algorithms analyze vital signs, predicting deterioration with unprecedented accuracy',
    gradient: 'linear-gradient(135deg, #1e293b 0%, #3b2a4a 100%)',
    accentColor: '#0ea5e9',
  },
  {
    id: 3,
    title: 'Unified Digital Twin',
    subtitle: 'Your entire ICU ecosystem in one place',
    description: 'Seamlessly integrated patient data, resource management, and clinical intelligence',
    gradient: 'linear-gradient(135deg, #0f172a 0%, #2a3f5a 100%)',
    accentColor: '#06b6d4',
  },
  {
    id: 4,
    title: 'Command Center',
    subtitle: 'Master your clinical environment',
    description: 'Dashboard intelligence designed for modern clinicians who demand precision and insight',
    gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    accentColor: '#a5f3fc',
  },
];

export default function PremiumPreLogin() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const autoPlayRef = useRef(null);

  useEffect(() => {
    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
      }, 6000);
    };

    startAutoPlay();
    return () => clearInterval(autoPlayRef.current);
  }, []);

  const handleSlideChange = (newSlide) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(newSlide);
    setTimeout(() => setIsTransitioning(false), 1000);
  };

  const handleCTA = () => {
    navigate('/login');
  };

  const currentItem = SLIDES[currentSlide];

  return (
    <motion.div
      className="premium-prelogin"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <BackgroundSlider slides={SLIDES} currentSlide={currentSlide} />

      <div className="prelogin-overlay" />

      <div className="prelogin-content">
        <AnimatePresence mode="wait">
          <SlideContent
            key={currentSlide}
            slide={currentItem}
            index={currentSlide}
          />
        </AnimatePresence>

        <motion.div
          className="prelogin-cta-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
        >
          <CTAButton onClick={handleCTA} accentColor={currentItem.accentColor} />
        </motion.div>

        <motion.div
          className="prelogin-indicators"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          {SLIDES.map((_, idx) => (
            <motion.button
              key={idx}
              className={`indicator-dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => handleSlideChange(idx)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
              style={{
                backgroundColor:
                  idx === currentSlide
                    ? currentItem.accentColor
                    : 'rgba(255, 255, 255, 0.3)',
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </motion.div>

        <motion.div
          className="prelogin-brand"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="brand-dot" />
          <span className="brand-text">ICU Twin v3.0</span>
        </motion.div>
      </div>

      <motion.div
        className="prelogin-hints"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2, duration: 0.6 }}
      >
        <p>← → or Click indicators to explore • Press Enter to begin</p>
      </motion.div>
    </motion.div>
  );
}
