import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const InputBar = ({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'Ask the assistant...',
  maxLength = 4000,
  variant = 'hero',
}) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className={`chatbot-composer chatbot-composer--${variant}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="chatbot-composer-textarea"
        rows={1}
        maxLength={maxLength}
      />

      <div className="chatbot-composer-footer">
        <div className="chatbot-composer-hint">Press Enter to send. Use Shift+Enter for a new line.</div>

        <div className="chatbot-composer-actions">
          <span className="chatbot-composer-count">
            {value.length}/{maxLength}
          </span>

          <motion.button
            type="button"
            className="chatbot-composer-send"
            onClick={onSend}
            disabled={!value.trim() || disabled}
            whileHover={!disabled && value.trim() ? { scale: 1.04 } : undefined}
            whileTap={!disabled && value.trim() ? { scale: 0.96 } : undefined}
            aria-label="Send question"
          >
            <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M10 15V5M10 5L6.5 8.5M10 5L13.5 8.5"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default InputBar;
