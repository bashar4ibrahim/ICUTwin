import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiArrowRight, FiChevronRight, FiShield, FiZap } from 'react-icons/fi';
import gsap from 'gsap';
import './EntryOverlay.css';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.18,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 18,
    transition: {
      duration: 0.72,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function EntryOverlay({ isExiting, onEnter, onSkip, remainingSeconds }) {
  const titleRef = useRef(null);
  const taglineRef = useRef(null);
  const descriptionRef = useRef(null);

  useEffect(() => {
    if (!isExiting) {
      const titleEl = titleRef.current;
      const taglineEl = taglineRef.current;
      const descEl = descriptionRef.current;

      // Use GSAP SplitText if available (Club GreenSock), otherwise fallback to CSS
      if (gsap.SplitText) {
        const titleSplit = new gsap.SplitText(titleEl, { type: 'chars' });
        const taglineSplit = new gsap.SplitText(taglineEl, { type: 'chars' });
        const descSplit = new gsap.SplitText(descEl, { type: 'words' });

        gsap.fromTo(
          titleSplit.chars,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.03,
            ease: 'back.out(1.2)',
          }
        );

        gsap.fromTo(
          taglineSplit.chars,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.02,
            delay: 0.4,
            ease: 'power2.out',
          }
        );

        gsap.fromTo(
          descSplit.words,
          { opacity: 0, y: 15 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.03,
            delay: 0.7,
            ease: 'power2.out',
          }
        );
      } else {
        // CSS fallback: add classes for character animation
        titleEl.classList.add('stagger-chars');
        taglineEl.classList.add('stagger-chars');
        descEl.classList.add('stagger-words');
      }
    }
  }, [isExiting]);

  return (
    <div className="entry-overlay">
      <motion.div
        className="entry-overlay__card"
        variants={containerVariants}
        initial="hidden"
        animate={isExiting ? 'exit' : 'visible'}
      >
        <motion.div className="entry-overlay__eyebrow" variants={itemVariants}>
          <span className="entry-overlay__eyebrow-dot" />
          Safwa AI System
        </motion.div>

        <motion.div className="entry-overlay__kicker" variants={itemVariants}>
          ICU Digital Twin Command Layer
        </motion.div>

        <motion.h1 className="entry-overlay__title" variants={itemVariants}>
          <span ref={titleRef}>Enter the clinical intelligence surface.</span>
        </motion.h1>

        <motion.p className="entry-overlay__tagline" variants={itemVariants}>
          <span ref={taglineRef}>AI-powered critical-care intelligence</span>
        </motion.p>

        <motion.p className="entry-overlay__description" variants={itemVariants}>
          <span ref={descriptionRef}>
            Live telemetry, predictive risk, resource coordination, and secure audit awareness in one premium entry flow.
          </span>
        </motion.p>

        <motion.div className="entry-overlay__signals" variants={itemVariants}>
          <div className="entry-signal">
            <FiZap />
            <span>Live telemetry</span>
          </div>
          <div className="entry-signal">
            <FiShield />
            <span>Secure by design</span>
          </div>
          <div className="entry-signal">
            <span className="entry-signal__metric">AI</span>
            <span>Prediction core online</span>
          </div>
        </motion.div>

        <motion.div className="entry-overlay__actions" variants={itemVariants}>
          <motion.button
            type="button"
            className="entry-overlay__button"
            animate={isExiting ? { y: 0 } : { y: [0, -10, 0] }}
            transition={{
              duration: 4.2,
              repeat: isExiting ? 0 : Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{
              scale: 1.03,
              boxShadow: '0 24px 80px rgba(34, 211, 238, 0.3)',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={onEnter}
          >
            <span className="entry-overlay__button-glow" />
            <span className="entry-overlay__button-text">Enter System</span>
            <motion.span
              className="entry-overlay__button-icon"
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FiArrowRight />
            </motion.span>
          </motion.button>

          <button type="button" className="entry-overlay__skip" onClick={onSkip}>
            Skip intro <FiChevronRight />
            {remainingSeconds !== null ? <span>{remainingSeconds}s</span> : null}
          </button>
        </motion.div>

        <motion.div className="entry-overlay__footer" variants={itemVariants}>
          <span>Judges see the platform before the login wall.</span>
          <span>Access transitions to `/login` after the cinematic exit.</span>
        </motion.div>
      </motion.div>
    </div>
  );
}