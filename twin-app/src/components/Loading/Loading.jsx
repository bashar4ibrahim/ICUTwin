import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import './Loading.css';

const Loading = ({ message = 'Syncing clinical intelligence...' }) => (
  <div className="state-panel">
    <div className="state-kicker">
      <span className="state-dot" />
      Live System Load
    </div>
    <div className="state-heading">{message}</div>
    <div className="state-copy">
      Pulling telemetry, patient context, predictive signals, and security events into one command surface.
    </div>
    <div className="state-rows">
      {['100%', '82%', '74%'].map((width, index) => (
        <div key={width + index} className="state-row">
          <div className="skeleton state-bar" style={{ width }} />
        </div>
      ))}
    </div>
  </div>
);

export default Loading;


