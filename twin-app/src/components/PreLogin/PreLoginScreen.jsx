import { useRef, useState, useEffect } from 'react';
import { ReactLenis } from 'lenis/dist/lenis-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import HeroBackground from './HeroBackground';
import EntryOverlay from './EntryOverlay';
import ParticleField from './ParticleField';
import MorphingIcon from './MorphingIcon';
import useIntroTransition from '../../hooks/useIntroTransition';
import './PreLoginScreen.css';

export default function PreLoginScreen() {
  const containerRef = useRef(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const progress = useTransform(scrollYProgress, value => value);

  useEffect(() => {
    const unsubscribe = progress.on('change', latest => {
      if (latest >= 0.95 && !showOverlay) {
        setShowOverlay(true);
      }
      if (latest >= 0.99 && !introComplete) {
        setIntroComplete(true);
      }
    });
    return () => unsubscribe();
  }, [progress, showOverlay, introComplete]);

  const { isExiting, startTransition, remainingSeconds } = useIntroTransition({
    loginPath: '/login',
    exitDurationMs: 820,
    autoSkipMs: 8000,
  });

  return (
    <motion.section
      className="prelogin-screen"
      initial={{ opacity: 0, scale: 1.015 }}
      animate={{
        opacity: isExiting ? 0 : 1,
        scale: isExiting ? 1.035 : 1,
        filter: isExiting ? 'blur(10px)' : 'blur(0px)',
      }}
      transition={{ duration: isExiting ? 0.82 : 0.95, ease: [0.22, 1, 0.36, 1] }}
    >
      <ReactLenis
        root
        options={{
          lerp: 0.08,
          smoothWheel: true,
          wheelMultiplier: 0.8,
          touchMultiplier: 0.8,
        }}
      >
        <div ref={containerRef} className="prelogin-shell">
          {/* Floating medical symbols particle field */}
          <ParticleField />

          {/* Hero background with morphing SVG icon replacing the static core */}
          <HeroBackground isExiting={isExiting} dimBackground={showOverlay}>
            <MorphingIcon className="hero-center-image__core" />
          </HeroBackground>

          {/* Dimming layer that fades in with the overlay */}
          <motion.div
            className="prelogin-overlay-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: showOverlay ? 1 : 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />

          {/* Overlay appears only after scroll completion */}
          {showOverlay && (
            <EntryOverlay
              isExiting={isExiting}
              onEnter={startTransition}
              onSkip={startTransition}
              remainingSeconds={remainingSeconds}
            />
          )}

          <div className="prelogin-vignette" />
          <div className="prelogin-grid" />
        </div>
      </ReactLenis>
    </motion.section>
  );
}