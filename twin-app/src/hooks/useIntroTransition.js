import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useIntroTransition({
  loginPath = '/login',
  exitDurationMs = 820,
  autoSkipMs = 8000,
} = {}) {
  const navigate = useNavigate();
  const exitTimerRef = useRef(null);
  const autoTimerRef = useRef(null);
  const startedAtRef = useRef(Date.now());
  const exitingRef = useRef(false);
  const [isExiting, setIsExiting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(
    autoSkipMs ? Math.ceil(autoSkipMs / 1000) : null
  );

  const clearTimers = useCallback(() => {
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    if (autoTimerRef.current) {
      window.clearInterval(autoTimerRef.current);
      autoTimerRef.current = null;
    }
  }, []);

  const startTransition = useCallback(() => {
    if (exitingRef.current) return;

    exitingRef.current = true;
    setIsExiting(true);
    clearTimers();

    exitTimerRef.current = window.setTimeout(() => {
      navigate(loginPath, { replace: false });
    }, exitDurationMs);
  }, [clearTimers, exitDurationMs, loginPath, navigate]);

  useEffect(() => {
    if (!autoSkipMs) return undefined;

    startedAtRef.current = Date.now();
    autoTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const remaining = Math.max(0, autoSkipMs - elapsed);
      setRemainingSeconds(Math.ceil(remaining / 1000));

      if (remaining <= 0) {
        clearTimers();
        startTransition();
      }
    }, 250);

    return clearTimers;
  }, [autoSkipMs, clearTimers, startTransition]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    isExiting,
    remainingSeconds,
    startTransition,
  };
}
