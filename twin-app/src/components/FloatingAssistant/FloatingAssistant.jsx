import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import './FloatingAssistant.css';

const FloatingAssistant = ({ onOpen, active }) => (
  <button
    type="button"
    className={`assistant-fab${active ? ' active' : ''}`}
    onClick={onOpen}
    aria-label="Open ICU Assistant"
  >
    <span className="assistant-label">{active ? 'ICU Assistant Active' : 'Open ICU Assistant'}</span>
    <span className="assistant-bubble">
      <span className="assistant-status-pill">
        <span className="assistant-status-dot" />
        AI
      </span>
      <svg className="assistant-robot" viewBox="0 0 96 96" aria-hidden="true">
        <defs>
          <linearGradient id="assistant-surface" x1="16" y1="12" x2="78" y2="82" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" />
            <stop offset="1" stopColor="#c9f3ff" />
          </linearGradient>
          <linearGradient id="assistant-accent" x1="24" y1="24" x2="70" y2="72" gradientUnits="userSpaceOnUse">
            <stop stopColor="#79d9ff" />
            <stop offset="1" stopColor="#4d8dff" />
          </linearGradient>
        </defs>
        <path d="M48 16c5.5 0 10 4.5 10 10v4H38v-4c0-5.5 4.5-10 10-10Z" fill="url(#assistant-accent)" />
        <path d="M30 33c0-7.2 5.8-13 13-13h10c7.2 0 13 5.8 13 13v19c0 10.5-8.5 19-19 19h-2c-10.5 0-19-8.5-19-19V33Z" fill="url(#assistant-surface)" stroke="#7bc8ff" strokeWidth="2.5" />
        <rect x="36" y="41" width="24" height="12" rx="6" fill="#ebfbff" stroke="#a7dfff" strokeWidth="2" />
        <circle cx="43" cy="47" r="4.2" fill="#0ea5e9" />
        <circle cx="53" cy="47" r="4.2" fill="#0ea5e9" />
        <path d="M39 61c5.9 4 12.1 4 18 0" stroke="#4d8dff" strokeWidth="3" strokeLinecap="round" />
        <path d="M31 41h-6c-3.3 0-6 2.7-6 6v2c0 3.3 2.7 6 6 6h5" stroke="#8fd9ff" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M65 41h6c3.3 0 6 2.7 6 6v2c0 3.3-2.7 6-6 6h-5" stroke="#8fd9ff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <span className="assistant-orbit assistant-orbit-one" />
      <span className="assistant-orbit assistant-orbit-two" />
    </span>
  </button>
);

export default FloatingAssistant;


