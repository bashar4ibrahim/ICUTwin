import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import './SlideContent.css';

export default function SlideContent({ slide, index }) {
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  useEffect(() => {
    setDisplayedTitle('');
    setIsTypingDone(false);

    const title = slide.title;
    let charIndex = 0;

    const typeInterval = setInterval(() => {
      if (charIndex < title.length) {
        setDisplayedTitle(title.substring(0, charIndex + 1));
        charIndex++;
      } else {
        setIsTypingDone(true);
        clearInterval(typeInterval);
      }
    }, 50);

    return () => clearInterval(typeInterval);
  }, [slide.title]);

  const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -30,
      transition: { duration: 0.6, ease: 'easeIn' },
    },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.4,
        duration: 0.8,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.6, ease: 'easeIn' },
    },
  };

  const descriptionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.7,
        duration: 0.8,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: { duration: 0.5, ease: 'easeIn' },
    },
  };

  const accentLineVariants = {
    hidden: { scaleX: 0, opacity: 0 },
    visible: {
      scaleX: 1,
      opacity: 1,
      transition: {
        delay: 0.2,
        duration: 0.8,
        ease: 'easeOut',
      },
    },
    exit: {
      scaleX: 0,
      opacity: 0,
      transition: { duration: 0.4, ease: 'easeIn' },
    },
  };

  return (
    <div className="slide-content">
      <motion.div
        className="accent-line"
        style={{ backgroundColor: slide.accentColor }}
        variants={accentLineVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      />

      <motion.div
        className="slide-title-container"
        variants={titleVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <h1 className="slide-title" style={{ color: slide.accentColor }}>
          {displayedTitle}
          <motion.span
            className="typing-cursor"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            |
          </motion.span>
        </h1>
      </motion.div>

      <motion.div
        className="slide-subtitle-container"
        variants={subtitleVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <p className="slide-subtitle">{slide.subtitle}</p>
      </motion.div>

      <motion.div
        className="slide-description-container"
        variants={descriptionVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <p className="slide-description">{slide.description}</p>
      </motion.div>

      <motion.div
        className="content-decoration"
        animate={{
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className="decoration-dot"
          style={{ backgroundColor: slide.accentColor }}
        />
      </motion.div>
    </div>
  );
}
