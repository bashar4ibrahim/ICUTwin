import React, { useRef, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import ThinkingIndicator from './ThinkingIndicator';


// ------------------------------------------------------------
// MessageContent – Handles plain text or safe HTML
// ------------------------------------------------------------
const MessageContent = ({ message, renderHtml }) => {
  if (message.isHtml && message.role === 'assistant') {
    // Sanitize the HTML to prevent XSS
    const cleanHtml = DOMPurify.sanitize(message.text);
    return (
      <div
        className="message-content assistant-html"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }
  return <div className="message-content">{message.text}</div>;
};

// ------------------------------------------------------------
// MessageBubble – Wraps content with avatar and timestamp
// ------------------------------------------------------------
const MessageBubble = ({ message, isGrouped }) => {
  const [copied, setCopied] = useState(false);
  const metaColor = message.role === 'user' ? 'rgba(255, 255, 255, 0.88)' : '#5f7486';

  const copyToClipboard = () => {
    navigator.clipboard?.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeStr = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      style={{
        display: 'flex',
        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: '0.5rem',
      }}
      initial={{ opacity: 0, x: message.role === 'user' ? 10 : -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {message.role === 'assistant' && !isGrouped && (
        <div
          style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            flexShrink: 0,
            boxShadow: '0 4px 8px rgba(0,180,216,0.2)',
          }}
        >
          🧬
        </div>
      )}
      {message.role === 'assistant' && isGrouped && <div style={{ width: '36px' }} />}
      <div style={{ maxWidth: '75%', position: 'relative' }}>
        <div className={`message-bubble message-bubble-${message.role}`}>
          <MessageContent message={message} />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '6px',
            }}
          >
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 600,
                color: metaColor,
                textShadow: 'none',
              }}
            >
              {timeStr}
            </span>
            <button className="copy-btn" onClick={copyToClipboard}>
              {copied ? '✓' : '📋'}
            </button>
          </div>
        </div>
      </div>
      {message.role === 'user' && (
        <div
          style={{
            width: '36px',
            height: '36px',
            background: 'linear-gradient(135deg, #8b5cf6, #00b4d8)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1rem',
            flexShrink: 0,
          }}
        >
          👤
        </div>
      )}
    </motion.div>
  );
};

// ------------------------------------------------------------
// Main MessageList Component
// ------------------------------------------------------------
const MessageList = ({ messages, thinking }) => {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!showScrollBtn) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, thinking]);

  // Group messages by role (consecutive same role)
  const grouped = [];
  let lastRole = null;
  messages.forEach((msg) => {
    if (msg.role !== lastRole) {
      grouped.push({ role: msg.role, messages: [msg] });
      lastRole = msg.role;
    } else {
      grouped[grouped.length - 1].messages.push(msg);
    }
  });

  return (
    <div
      ref={containerRef}
      className="chat-messages-container"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative',
      }}
    >
      <AnimatePresence>
        {grouped.map((group, idx) => (
          <motion.div
            key={idx}
            className={`message-group message-group-${group.role}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {group.messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} isGrouped={i > 0} />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
      {thinking && <ThinkingIndicator />}
      <div ref={bottomRef} />
      {showScrollBtn && (
        <motion.button
          className="scroll-bottom-btn"
          onClick={scrollToBottom}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
        >
          ↓
        </motion.button>
      )}
    </div>
  );
};

export default MessageList;
