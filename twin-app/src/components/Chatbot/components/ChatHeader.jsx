import React from 'react';
import { motion } from 'framer-motion';

const ChatHeader = ({ historyLoaded, onClear }) => (
  <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(0,180,216,0.15)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
    <motion.div
      style={{
        width: '48px', height: '48px', background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
        borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(0,180,216,0.2)',
      }}
      whileHover={{ scale: 1.05 }}
    >
      🧬
    </motion.div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 700, fontSize: '1.2rem', color: '#0a2540' }}>ICU Twin Assistant</div>
      <div className="live-indicator">
        <span className="live-dot" />
        {historyLoaded ? 'Connected • Real-time' : 'Syncing...'}
      </div>
    </div>
    <button className="btn btn-sm btn-ghost" onClick={onClear}>Clear Chat</button>
  </div>
);

export default ChatHeader;