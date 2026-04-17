// LandingPage.jsx
import React, { useRef } from 'react';
import { ReactLenis } from 'lenis/dist/lenis-react';
import {
  motion,
  useMotionTemplate,
  useScroll,
  useTransform,
} from 'framer-motion';
import { FiArrowRight, FiActivity, FiShield } from 'react-icons/fi';

const SECTION_HEIGHT = 1500;

const LandingPage = ({ onEnter }) => {
  return (
    <div className="landing-root">
      <ReactLenis
        root
        options={{
          lerp: 0.05,
          smoothWheel: true,
        }}
      >
        <Nav onEnter={onEnter} />
        <Hero />
        <Features />
        <Footer onEnter={onEnter} />
      </ReactLenis>
    </div>
  );
};

const Nav = ({ onEnter }) => {
  return (
    <nav className="landing-nav">
      <div className="landing-logo">
        <span className="logo-icon">🧬</span>
        <span className="logo-text">ICU Digital Twin</span>
      </div>
      <button onClick={onEnter} className="landing-enter-btn">
        Enter Platform <FiArrowRight />
      </button>
    </nav>
  );
};

const Hero = () => {
  return (
    <div
      style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)` }}
      className="hero-wrapper"
    >
      <CenterImage />
      <ParallaxImages />
      <div className="hero-gradient-bottom" />
    </div>
  );
};

const CenterImage = () => {
  const { scrollY } = useScroll();

  const clip1 = useTransform(scrollY, [0, 1500], [25, 0]);
  const clip2 = useTransform(scrollY, [0, 1500], [75, 100]);

  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

  const backgroundSize = useTransform(
    scrollY,
    [0, SECTION_HEIGHT + 500],
    ['170%', '100%']
  );
  const opacity = useTransform(
    scrollY,
    [SECTION_HEIGHT, SECTION_HEIGHT + 500],
    [1, 0]
  );

  return (
    <motion.div
      className="hero-center-image"
      style={{
        clipPath,
        backgroundSize,
        opacity,
        backgroundImage:
          'url(https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2)', // Medical lab / technology image
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
};

const ParallaxImages = () => {
  return (
    <div className="parallax-container">
      <ParallaxImg
        src="https://images.pexels.com/photos/3844581/pexels-photo-3844581.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" // ICU monitor
        alt="ICU patient monitor"
        start={-200}
        end={200}
        className="parallax-img-left"
      />
      <ParallaxImg
        src="https://images.pexels.com/photos/3825539/pexels-photo-3825539.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" // DNA helix / AI
        alt="DNA helix digital art"
        start={200}
        end={-250}
        className="parallax-img-center"
      />
      <ParallaxImg
        src="https://images.pexels.com/photos/3735703/pexels-photo-3735703.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" // Doctors with tablet
        alt="Medical team using technology"
        start={-200}
        end={200}
        className="parallax-img-right"
      />
      <ParallaxImg
        src="https://images.pexels.com/photos/4386476/pexels-photo-4386476.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" // AI brain / network
        alt="AI neural network visualization"
        start={0}
        end={-500}
        className="parallax-img-bottom"
      />
    </div>
  );
};

const ParallaxImg = ({ className, alt, src, start, end }) => {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`${start}px end`, `end ${end * -1}px`],
  });

  const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);

  const y = useTransform(scrollYProgress, [0, 1], [start, end]);
  const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;

  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      ref={ref}
      style={{ transform, opacity }}
    />
  );
};

const Features = () => {
  return (
    <section className="landing-features">
      <motion.h2
        initial={{ y: 48, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ ease: 'easeInOut', duration: 0.75 }}
        className="features-title"
      >
        Real‑time Clinical Intelligence
      </motion.h2>
      <div className="features-grid">
        <FeatureCard
          icon={<FiActivity />}
          title="AI Risk Prediction"
          description="Continuous monitoring and early warning for patient deterioration."
        />
        <FeatureCard
          icon={<FiShield />}
          title="Digital Twin Simulation"
          description="Personalized physiological models for every patient."
        />
        <FeatureCard
          icon={<FiArrowRight />}
          title="Seamless Integration"
          description="Connects with existing ICU monitors and EHR systems."
        />
      </div>
    </section>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    initial={{ y: 48, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    transition={{ ease: 'easeInOut', duration: 0.75 }}
    className="feature-card"
  >
    <div className="feature-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
  </motion.div>
);

const Footer = ({ onEnter }) => {
  return (
    <section className="landing-footer">
      <motion.div
        initial={{ y: 48, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ ease: 'easeInOut', duration: 0.75 }}
        className="footer-content"
      >
        <h2>Experience the future of critical care</h2>
        <button onClick={onEnter} className="landing-cta">
          Launch Dashboard <FiArrowRight />
        </button>
        <p className="footer-note">
          ICU Digital Twin — Powered by AI. Secure. Real‑time.
        </p>
      </motion.div>
    </section>
  );
};

export default LandingPage;