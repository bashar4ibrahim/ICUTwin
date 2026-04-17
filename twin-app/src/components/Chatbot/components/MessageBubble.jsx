import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DynamicContentRenderer from './DynamicContentRenderer';

const MessageBubble = ({ message, isGrouped }) => {
  const [copied, setCopied] = useState(false);
  const copyToClipboard = () => {
    navigator.clipboard?.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeStr = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      style={{ display: 'flex', justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: '0.5rem' }}
      initial={{ opacity: 0, x: message.role === 'user' ? 10 : -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {message.role === 'assistant' && !isGrouped && (
        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #00b4d8, #0077b6)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, boxShadow: '0 4px 8px rgba(0,180,216,0.2)' }}>🧬</div>
      )}
      {message.role === 'assistant' && isGrouped && <div style={{ width: '36px' }} />}
      <div style={{ maxWidth: '75%', position: 'relative' }}>
        <div className={`message-bubble message-bubble-${message.role}`}>
          <DynamicContentRenderer content={message.text} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '0.6rem', opacity: 0.7 }}>{timeStr}</span>
            <button className="copy-btn" onClick={copyToClipboard}>
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </div>
      </div>
      {message.role === 'user' && (
        <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #8b5cf6, #00b4d8)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>👤</div>
      )}
    </motion.div>
  );
};

export default MessageBubble;