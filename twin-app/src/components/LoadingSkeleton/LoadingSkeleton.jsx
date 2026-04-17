import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import './LoadingSkeleton.css';

const LoadingSkeleton = ({ lines = 3 }) => {
  const widths = ['100%', '92%', '78%', '88%', '70%', '84%'];
  return (
    <div className="loading-skeleton">
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div className="state-kicker" style={{ marginBottom: 'var(--space-5)' }}>
          <span className="state-dot" />
          Preparing View
        </div>
        {Array(lines).fill(0).map((_, i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              height: i === 0 ? '18px' : '60px',
              width: widths[i % widths.length],
              marginBottom: i === lines - 1 ? 0 : 'var(--space-4)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;


