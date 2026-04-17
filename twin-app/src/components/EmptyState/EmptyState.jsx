import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import './EmptyState.css';

const EmptyState = ({ icon, message }) => (
  <div className="empty-state">
    <div className="empty-state-icon">{icon}</div>
    <div className="empty-state-text">{message}</div>
  </div>
);

export default EmptyState;


