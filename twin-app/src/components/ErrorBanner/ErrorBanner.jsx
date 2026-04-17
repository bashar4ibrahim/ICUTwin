import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import './ErrorBanner.css';

const ErrorBanner = ({ msg }) => (
  <div className="error-banner">
    <div className="error-banner-icon">!</div>
    <div className="error-banner-text">{msg}</div>
  </div>
);

export default ErrorBanner;


