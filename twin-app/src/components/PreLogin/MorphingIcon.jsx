// MorphingIcon.jsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const HEARTBEAT_PATH = "M10,50 L20,50 L25,30 L30,70 L35,50 L45,50 L50,40 L55,60 L60,50 L90,50";
const DNA_PATH = "M30,20 C50,10 70,10 90,20 C70,30 50,30 30,20 M30,40 C50,50 70,50 90,40 C70,30 50,30 30,40 M30,60 C50,70 70,70 90,60 C70,50 50,50 30,60";
const CROSS_PATH = "M45,20 L55,20 L55,45 L80,45 L80,55 L55,55 L55,80 L45,80 L45,55 L20,55 L20,45 L45,45 Z";

const MorphingIcon = ({ className }) => {
  const pathRef = useRef(null);
  const paths = [HEARTBEAT_PATH, DNA_PATH, CROSS_PATH];
  let currentIndex = 0;

  useEffect(() => {
    const path = pathRef.current;
    
    const morphNext = () => {
      currentIndex = (currentIndex + 1) % paths.length;
      const nextPath = paths[currentIndex];
      
      if (gsap.MorphSVG) {
        gsap.to(path, {
          duration: 3,
          morphSVG: nextPath,
          ease: 'power2.inOut',
          onComplete: () => setTimeout(morphNext, 2000),
        });
      } else {
        gsap.to(path, {
          duration: 0.5,
          opacity: 0,
          onComplete: () => {
            path.setAttribute('d', nextPath);
            gsap.to(path, { duration: 0.5, opacity: 1, onComplete: () => setTimeout(morphNext, 2000) });
          },
        });
      }
    };

    const timer = setTimeout(morphNext, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <svg viewBox="0 0 100 100" className={className} style={{ width: '100%', height: '100%' }}>
      <path
        ref={pathRef}
        d={HEARTBEAT_PATH}
        fill="none"
        stroke="rgba(34, 211, 238, 0.7)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="drop-shadow(0 0 12px #22d3ee)"
      />
    </svg>
  );
};

export default MorphingIcon;