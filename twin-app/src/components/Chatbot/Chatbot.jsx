import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
// JOB 1: SETUP on page load          → "Restore old messages, create session ID"
// JOB 2: ANSWER questions (2 levels) → "Try local first, then call server"
// JOB 3: MANAGE conversation         → "Clear history, track state"
// JOB 4: RENDER two UI modes         → "Hero landing page OR conversation thread"
import {
  FiActivity,
  FiAlertCircle,
  FiArrowRight,
  FiClock,
  FiCpu,
  FiRefreshCw,
  FiTrendingUp,
} from 'react-icons/fi';
import './Chatbot.css';
import {
  apiFetch,
  normalizeChatHistory,
  answerClinicalQuestion,
} from '../../app/shared';
import { useClinicalIntelligence } from '../ClinicalIntelligenceProvider/ClinicalIntelligenceProvider';
import ErrorBanner from '../ErrorBanner/ErrorBanner';
import MessageList from './components/MessageList';
import InputBar from './components/InputBar';

const createWelcomeMessage = () => ({
  role: 'assistant',
  text: "Hello, Doctor. I'm your ICU Digital Twin assistant. Ask me about patient risk, recent changes, or ICU capacity whenever you're ready.",
  timestamp: new Date().toISOString(),
  isHtml: false,
});

const FEATURED_PROMPTS = [
  {
    title: 'High-risk patients',
    description: 'Identify the patients most likely to deteriorate and explain the drivers behind the risk.',
    prompt: 'Which ICU patients are at highest risk right now, and why?',
    icon: FiAlertCircle,
  },
  {
    title: 'Last 6-hour changes',
    description: 'Summarize the biggest clinical shifts, new alerts, and worsening trends across the unit.',
    prompt: 'What changed in the ICU over the last 6 hours?',
    icon: FiTrendingUp,
  },
  {
    title: 'Resource readiness',
    description: 'Review ICU beds, ventilator readiness, and operational pressure points before the next handoff.',
    prompt: 'Give me the ICU resource summary and any capacity risks.',
    icon: FiCpu,
  },
];

function Chatbot() {
  const { snapshots, predictions, history, alerts } = useClinicalIntelligence();

  const [messages, setMessages] = useState([createWelcomeMessage()]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState('');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [currentModel, setCurrentModel] = useState(null);
  const [queryType, setQueryType] = useState(null);

  const sessionId = useRef(
    localStorage.getItem('icu_chat_session') || `session_${Date.now()}`
  );

  useEffect(() => {
    localStorage.setItem('icu_chat_session', sessionId.current);
  }, []);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const payload = await apiFetch(
          `/chatbot/history?session_id=${encodeURIComponent(sessionId.current)}`
        );
        const restored = normalizeChatHistory(payload);
        if (restored.length > 0) {
          setMessages(
            restored.map((msg) => ({
              ...msg,
              timestamp: msg.timestamp || new Date().toISOString(),
              // All backend assistant messages are HTML
              isHtml: msg.role === 'assistant' && !msg.isError,
            }))
          );
        }
      } catch (err) {
        console.warn('Failed to load chat history:', err);
      } finally {
        setHistoryLoaded(true);
      }
    };

    loadHistory();
  }, []);

  const send = async (text) => {
    const q = (text || input).trim();
    if (!q) return;

    setInput('');
    setError('');
    setCurrentModel(null);
    setQueryType(null);

    const userMsg = {
      role: 'user',
      text: q,
      timestamp: new Date().toISOString(),
      isHtml: false,
    };

    setMessages((prev) => [...prev, userMsg]);
    setThinking(true);

    try {
      const localAnswer = answerClinicalQuestion({
        query: q,
        snapshots,
        predictions,
        history,
        alerts,
      });

      if (localAnswer) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: localAnswer,
            timestamp: new Date().toISOString(),
            isHtml: false, // local answers are plain text
          },
        ]);
        setThinking(false);
        return;
      }

      const data = await apiFetch('/chatbot/query', {
        method: 'POST',
        body: JSON.stringify({
          question: q,
          session_id: sessionId.current,
        }),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.answer, // This is HTML from backend
          timestamp: data.timestamp || new Date().toISOString(),
          isHtml: true, // Always true for backend responses
          raw: data.answer_raw,
          model: data.model,
          queryType: data.query_type,
        },
      ]);
      setCurrentModel(data.model);
      setQueryType(data.query_type);
    } catch (e) {
      console.error('Chatbot API error:', e);
      setError(e.message || 'Connection failed');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Sorry, I could not connect to the AI server. Please try again or check your connection.',
          timestamp: new Date().toISOString(),
          isHtml: false,
          isError: true,
        },
      ]);
    } finally {
      setThinking(false);
    }
  };

  const clearHistory = async () => {
    try {
      await apiFetch(
        `/chatbot/history?session_id=${encodeURIComponent(sessionId.current)}`,
        { method: 'DELETE' }
      );
      setMessages([createWelcomeMessage()]);
      setCurrentModel(null);
      setQueryType(null);
      setInput('');
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  const patientCount = Object.keys(snapshots || {}).length;
  const predictionCount = Object.keys(predictions || {}).length;
  const activeAlerts = Array.isArray(alerts) ? alerts.length : 0;
  const hasConversation = messages.some((message) => message.role === 'user');

  const statusChips = [
    { icon: FiActivity, label: 'Patients in context', value: patientCount || '0' },
    { icon: FiAlertCircle, label: 'Active alerts', value: activeAlerts || '0' },
    { icon: FiClock, label: 'Predictions ready', value: predictionCount || '0' },
  ];

  return (
    <motion.div
      className="chatbot-page"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
    >
      <section className="chatbot-hero-panel">
        <div className="chatbot-eyebrow">ICU Clinical Copilot</div>
        <h1 className="chatbot-greeting">Hello, Doctor.</h1>
        <h2 className="chatbot-greeting chatbot-greeting--accent">
          How can I help in the ICU today?
        </h2>
        <p className="chatbot-lead">
          Use one of the common ICU prompts below or ask your own question about patient risk,
          trend changes, handoff priorities, or resource readiness.
        </p>

        <div className="chatbot-stats">
          {statusChips.map(({ icon: Icon, label, value }) => (
            <div key={label} className="chatbot-stat-chip">
              <span className="chatbot-stat-icon">
                <Icon />
              </span>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>

        <div className="chatbot-prompt-grid">
          {FEATURED_PROMPTS.map(({ title, description, prompt, icon: Icon }, index) => (
            <motion.button
              key={title}
              type="button"
              className="chatbot-prompt-card"
              onClick={() => send(prompt)}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <span className="chatbot-prompt-icon">
                <Icon />
              </span>
              <div className="chatbot-prompt-body">
                <span className="chatbot-prompt-title">{title}</span>
                <span className="chatbot-prompt-copy">{description}</span>
              </div>
              <span className="chatbot-prompt-arrow">
                <FiArrowRight />
              </span>
            </motion.button>
          ))}
        </div>

        {!hasConversation && (
          <InputBar
            value={input}
            onChange={setInput}
            onSend={send}
            disabled={thinking}
            maxLength={4000}
            placeholder="Type your ICU question here..."
          />
        )}

        {(currentModel || queryType) && (
          <div className="model-badge">
            <small>
              {currentModel ? `Model: ${currentModel.split('/').pop()}` : 'AI response ready'}
              {queryType ? ` • ${queryType}` : ''}
            </small>
          </div>
        )}
      </section>

      {error && <ErrorBanner msg={error} onDismiss={() => setError('')} />}

      {(hasConversation || thinking) && (
        <section className="chat-card chatbot-conversation-card">
          <div className="chatbot-conversation-header">
            <div>
              <div className="chatbot-conversation-title">ICU Assistant Conversation</div>
              <div className="live-indicator">
                <span className="live-dot" />
                {historyLoaded ? 'Live clinical context ready' : 'Syncing assistant history...'}
              </div>
            </div>

            <div className="chatbot-conversation-actions">
              <button className="btn btn-ghost btn-sm" onClick={clearHistory} type="button">
                <FiRefreshCw />
                Clear chat
              </button>
            </div>
          </div>

          <MessageList messages={messages} thinking={thinking} />

          <InputBar
            value={input}
            onChange={setInput}
            onSend={send}
            disabled={thinking}
            maxLength={4000}
            placeholder="Ask a follow-up about patients, vitals, alerts, or resources..."
            variant="thread"
          />
        </section>
      )}
    </motion.div>
  );
}

export default Chatbot;
