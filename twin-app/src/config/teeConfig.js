// TEE (Trusted Execution Environment) Configuration
// Controls where cryptographic proof endpoints are reached

const isDevelopment = import.meta.env.MODE === 'development';

// Use the external TEE service by default, or override via env var
const TEE_BASE_URL =
  import.meta.env.VITE_TEE_BASE_URL || 'https://capstone.dpdns.org/tee';

/** Default request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 8000;

/** Minimum polling interval in ms (used after errors with backoff) */
const MIN_POLL_INTERVAL_MS = 10000;

/** Maximum polling interval in ms (caps exponential backoff) */
const MAX_POLL_INTERVAL_MS = 120000;

/**
 * Fetch wrapper with timeout via AbortController.
 * Prevents requests from hanging indefinitely when the backend is down.
 */
async function teeFetch(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || `HTTP ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out — backend may be unreachable');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Calculate next poll interval using exponential backoff.
 * @param {number} consecutiveErrors - number of consecutive failures
 * @returns {number} milliseconds to wait before next poll
 */
function getBackoffInterval(consecutiveErrors) {
  if (consecutiveErrors <= 0) return MIN_POLL_INTERVAL_MS;
  const backoff = MIN_POLL_INTERVAL_MS * Math.pow(2, Math.min(consecutiveErrors, 6));
  return Math.min(backoff, MAX_POLL_INTERVAL_MS);
}

export default {
  baseUrl: TEE_BASE_URL,
  endpoints: {
    securityReport: `${TEE_BASE_URL}/security_report`,
    encrypt: `${TEE_BASE_URL}/encrypt`,
    decrypt: `${TEE_BASE_URL}/decrypt`,
    encryptedPredict: `${TEE_BASE_URL}/encrypted_predict`,
    verify: `${TEE_BASE_URL}/verify`,
    attest: `${TEE_BASE_URL}/attest`,
    attestVerify: `${TEE_BASE_URL}/attest/verify`,
    auditRoot: `${TEE_BASE_URL}/audit/root`,
    auditRecent: `${TEE_BASE_URL}/audit/recent`,
    auditVerifyIntegrity: `${TEE_BASE_URL}/audit/verify_integrity`,
  },
  // Fallback values for development/demo when backend isn't available
  mockMode: isDevelopment && import.meta.env.VITE_TEE_MOCK === 'true',
  // Timeout & backoff helpers
  REQUEST_TIMEOUT_MS,
  MIN_POLL_INTERVAL_MS,
  MAX_POLL_INTERVAL_MS,
  teeFetch,
  getBackoffInterval,
};
