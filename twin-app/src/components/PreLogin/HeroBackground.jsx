import { useRef } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion';
import {
  FiActivity,
  FiArrowDownRight,
  FiCpu,
  FiLayers,
  FiShield,
} from 'react-icons/fi';
import './HeroBackground.css';

const SECTION_HEIGHT = 620;

const PANELS = [
  {
    title: 'Telemetry Stream',
    value: 'WebSocket Live',
    copy: 'Vitals, resources, and ICU state synchronized in real time.',
    Icon: FiActivity,
    start: -130,
    end: 135,
    drift: 18,
    className: 'hero-panel--left',
  },
  {
    title: 'Prediction Core',
    value: '7-Day Risk',
    copy: 'Clinical AI scoring with explainability, trends, and escalation logic.',
    Icon: FiCpu,
    start: 160,
    end: -170,
    drift: -16,
    className: 'hero-panel--center',
  },
  {
    title: 'Security Layer',
    value: 'Access Aware',
    copy: 'Clinical workspace safeguards stay visible without a separate security module.',
    Icon: FiShield,
    start: -170,
    end: 160,
    drift: 22,
    className: 'hero-panel--right',
  },
  {
    title: 'Twin Orchestration',
    value: 'Resource Ready',
    copy: 'Beds, devices, and intervention pathways visible before entry.',
    Icon: FiLayers,
    start: 60,
    end: -220,
    drift: -24,
    className: 'hero-panel--lower',
  },
];

export default function HeroBackground({ isExiting, dimBackground, children }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 90, damping: 18, mass: 0.5 });
  const smoothY = useSpring(mouseY, { stiffness: 90, damping: 18, mass: 0.5 });

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const normalizedX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const normalizedY = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  };

  const resetMouse = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <section
      className="hero-background"
      onMouseMove={handleMouseMove}
      onMouseLeave={resetMouse}
    >
      <div
        className="hero-background__track"
        style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)` }}
      >
        <motion.div
          className="hero-background__stage"
          animate={{
            opacity: isExiting ? 0.35 : dimBackground ? 0.7 : 1,
            scale: isExiting ? 1.045 : 1,
          }}
          transition={{ duration: 0.82, ease: [0.22, 1, 0.36, 1] }}
        >
          <CenterImage mouseX={smoothX} mouseY={smoothY}>
            {children}
          </CenterImage>

          <div className="hero-background__panels">
            {PANELS.map((panel) => (
              <ParallaxPanel
                key={panel.title}
                {...panel}
                mouseX={smoothX}
                mouseY={smoothY}
              />
            ))}
          </div>

          <div className="hero-background__ambient hero-background__ambient--one" />
          <div className="hero-background__ambient hero-background__ambient--two" />
          <div className="hero-background__bottom-fade" />
        </motion.div>
      </div>
    </section>
  );
}

const CenterImage = ({ mouseX, mouseY, children }) => {
  const { scrollY } = useScroll();

  const clip1 = useTransform(scrollY, [0, SECTION_HEIGHT], [20, 0]);
  const clip2 = useTransform(scrollY, [0, SECTION_HEIGHT], [80, 100]);
  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;

  const backgroundSize = useTransform(
    scrollY,
    [0, SECTION_HEIGHT + 180],
    ['138%', '104%']
  );
  const backgroundY = useTransform(scrollY, [0, SECTION_HEIGHT], ['45%', '58%']);
  const stageOpacity = useTransform(
    scrollY,
    [SECTION_HEIGHT - 120, SECTION_HEIGHT + 80],
    [1, 0.62]
  );

  const backdropX = useTransform(mouseX, [-1, 1], [-22, 22]);
  const backdropY = useTransform(mouseY, [-1, 1], [-18, 18]);
  const coreX = useTransform(mouseX, [-1, 1], [-34, 34]);
  const coreY = useTransform(mouseY, [-1, 1], [-26, 26]);
  const coreRotateX = useTransform(mouseY, [-1, 1], [7, -7]);
  const coreRotateY = useTransform(mouseX, [-1, 1], [-10, 10]);
  const haloX = useTransform(mouseX, [-1, 1], [-48, 48]);
  const haloY = useTransform(mouseY, [-1, 1], [-30, 30]);
  const coreScale = useTransform(scrollY, [0, SECTION_HEIGHT], [0.92, 1.04]);

  return (
    <motion.div
      className="hero-center-image"
      style={{
        clipPath,
        backgroundSize,
        backgroundPositionY: backgroundY,
        opacity: stageOpacity,
        x: backdropX,
        y: backdropY,
      }}
    >
      <div className="hero-center-image__overlay" />
      <div className="hero-center-image__grid" />

      <motion.div
        className="hero-center-image__halo"
        style={{ x: haloX, y: haloY }}
      />

      {/* Replace static image with children (MorphingIcon) */}
      <motion.div
        className="hero-center-image__core"
        style={{
          x: coreX,
          y: coreY,
          scale: coreScale,
          rotateX: coreRotateX,
          rotateY: coreRotateY,
        }}
      >
        {children}
      </motion.div>

      <div className="hero-center-image__diagnostics">
        <div className="hero-center-image__diagnostic">
          <span>AI Core</span>
          <strong>Prime</strong>
        </div>
        <div className="hero-center-image__diagnostic">
          <span>Response</span>
          <strong>&lt; 1s</strong>
        </div>
        <div className="hero-center-image__diagnostic">
          <span>Signal Mesh</span>
          <strong>Online</strong>
        </div>
      </div>
    </motion.div>
  );
};

const ParallaxPanel = ({
  className,
  title,
  value,
  copy,
  Icon,
  start,
  end,
  drift,
  mouseX,
  mouseY,
}) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`${start}px end`, `end ${end * -1}px`],
  });

  const y = useTransform(scrollYProgress, [0, 1], [start, end]);
  const opacity = useTransform(scrollYProgress, [0.78, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.9]);
  const x = useTransform(mouseX, [-1, 1], [drift * -1, drift]);
  const rotateY = useTransform(mouseX, [-1, 1], [-7, 7]);
  const rotateX = useTransform(mouseY, [-1, 1], [6, -6]);

  return (
    <motion.article
      ref={ref}
      className={`hero-panel ${className}`}
      style={{ x, y, opacity, scale, rotateX, rotateY }}
    >
      <div className="hero-panel__icon">
        <Icon />
      </div>
      <div className="hero-panel__content">
        <span className="hero-panel__label">{title}</span>
        <strong className="hero-panel__value">{value}</strong>
        <p className="hero-panel__copy">{copy}</p>
      </div>
      <span className="hero-panel__arrow">
        <FiArrowDownRight />
      </span>
    </motion.article>
  );
};
