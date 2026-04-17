import React from 'react';
import { motion } from 'framer-motion';
import { API_BASE, WS_BASE, QUICK_PROMPTS } from '../../../app/shared';

const QuickPromptsSidebar = ({ onPromptClick }) => (
  <motion.div
    className="chat-card"
    style={{ padding: '1.5rem' }}
    initial={{ x: 20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: 0.2 }}
  >
    <div className="card-title"><span>⚡ Quick Queries</span></div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {QUICK_PROMPTS.map(prompt => (
        <button key={prompt} className="btn btn-sm quick-prompt-btn" onClick={() => onPromptClick(prompt)}>
          → {prompt}
        </button>
      ))}
    </div>
    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,180,216,0.2)' }}>
      <div className="card-title"><span>📡 System Status</span></div>
      <div style={{ fontSize: '0.8rem', color: '#1e4968', lineHeight: '1.8' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Backend</span><span style={{ fontWeight: 600 }}>{API_BASE}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>WebSocket</span><span style={{ fontWeight: 600 }}>{WS_BASE}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Session</span><span style={{ color: '#0077b6', fontWeight: 600 }}>Active</span></div>
      </div>
    </div>
  </motion.div>
);

export default QuickPromptsSidebar;