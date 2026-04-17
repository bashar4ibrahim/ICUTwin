import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import './ErrorMsg.css';

const ErrorMsg = ({ msg }) => (
  <div className="error-msg">
    <div className="card" style={{ background: 'rgba(244, 63, 94, 0.1)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#f43f5e' }}>
      <span>⚠ {msg}</span>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// 2. SIDEBAR - Premium Navigation
// ─────────────────────────────────────────────────────────────────────────────

export default ErrorMsg;


