/**
 * Patient Streaming API Utility
 * Handles WebSocket connections and polling for real-time vital signs
 */

const WS_BASE = 'wss://capstone.dpdns.org/ws/stream';

/**
 * Fetch patient vital data from WebSocket streaming API
 * @param {string} patientId - Patient ID to stream
 * @returns {Promise} Patient data with vitals
 */
/* export async function fetchPatientVitalsFromAPI(patientId) {
  return new Promise((resolve, reject) => {
    try {
      const wsUrl = `${WS_BASE}/${patientId}`;
      const ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      ws.onopen = () => {
        console.log(`Connected to patient stream: ${patientId}`);
      };

      ws.onmessage = (event) => {
        try {
          clearTimeout(timeout);
          const data = JSON.parse(event.data);
          ws.close();
          resolve(data);
        } catch (e) {
          reject(e);
        }
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('WebSocket error:', error);
        reject(error);
      };

      ws.onclose = () => {
        clearTimeout(timeout);
      };
    } catch (err) {
      reject(err);
    }
  });
}
*/
export async function fetchPatientVitalsFromAPI(patientId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_BASE}/${patientId}`);
    const timeout = setTimeout(() => { ws.close(); reject(new Error('Timeout')); }, 8000);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Skip pings, wait for real data
        if (data.type === 'ping') return;
        clearTimeout(timeout);
        ws.close();
        resolve(data);
      } catch (e) { reject(e); }
    };

    ws.onerror = () => { clearTimeout(timeout); reject(new Error('WS error')); };
  });
}
/**
 * Create patient refresh subscription
 * Fetches and updates patient vitals every 20 seconds
 * @param {string} patientId - Patient ID
 * @param {Function} onUpdate - Callback when data is fetched
 * @param {Function} onError - Callback on error
 * @returns {number} Interval ID for cleanup
 */
/*export function subscribeToPatientStream(patientId, onUpdate, onError) {
  // Initial fetch
  fetchPatientVitalsFromAPI(patientId)
    .then(data => onUpdate(data))
    .catch(err => onError(err));

  // Set up 20-second polling interval
  const intervalId = setInterval(() => {
    fetchPatientVitalsFromAPI(patientId)
      .then(data => onUpdate(data))
      .catch(err => {
        console.warn(`Failed to refresh vitals for patient ${patientId}:`, err);
        onError(err);
      });
  }, 20 * 1000); // 20 seconds

  return intervalId;
}
*/
/**
 * Unsubscribe from patient stream
 * @param {number} intervalId - Interval ID returned from subscribeToPatientStream
 */
/*export function unsubscribeFromPatientStream(intervalId) {
  if (intervalId) {
    clearInterval(intervalId);
  }
}*/
export function subscribeToPatientStream(patientId, onUpdate, onError) {
  let ws = null;
  let destroyed = false;
  let reconnectTimer = null;

  function connect() {
    if (destroyed) return;
    ws = new WebSocket(`${WS_BASE}/${patientId}`);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ping') return; // ignore keep-alives
        onUpdate(data);
      } catch (e) {
        onError(e);
      }
    };

    ws.onerror = (e) => {
      onError(e);
    };

    ws.onclose = () => {
      if (!destroyed) {
        // Auto-reconnect after 5s
        reconnectTimer = setTimeout(connect, 5000);
      }
    };
  }

  connect();

  // Return a cleanup handle (same shape as before — Patients.jsx calls unsubscribeFromPatientStream on it)
  return { ws: () => ws, destroy: () => {
    destroyed = true;
    clearTimeout(reconnectTimer);
    if (ws) ws.close();
  }};
}

export function unsubscribeFromPatientStream(handle) {
  if (!handle) return;
  // Support both old intervalId numbers and new handle objects
  if (typeof handle === 'number') {
    clearInterval(handle);
  } else if (handle?.destroy) {
    handle.destroy();
  }
}

/**
 * Convert streaming API response to patient record format
 * @param {object} apiData - Data from WebSocket API
 * @returns {object} Normalized patient record
 */
export function normalizeStreamingResponse(apiData) {
  if (!apiData) return null;

  const { patient_id, vitals, state, timestamp } = apiData;

  // ── Pull risk fields that the backend now sends ──────────────────
  const riskPercentage = apiData.riskPercentage ?? 
                         apiData.risk?.risk_assessment?.overall_score ?? 
                         0;
  const riskLabel      = apiData.label ?? 
                         apiData.risk?.risk_assessment?.category ?? 
                         'LOW RISK';

  return {
    patient_id,
    status: state || apiData.simulator_state || 'stable',
    
    // ── This is what ClinicalIntelligenceProvider reads ───────────
    prediction: {
      risk: {
        riskPercentage,
        label: riskLabel,
        mort_7d:     apiData.mort_7d,
        mort_30d:    apiData.mort_30d,
        sofa_score:  apiData.sofa_score,
        shock_index: apiData.shock_index,
        factors:     apiData.factors || [],
      }
    },

    latest_vitals: {
      heart_rate:        vitals?.heart_rate,
      blood_pressure_sys: vitals?.blood_pressure_sys,
      blood_pressure_dia: vitals?.blood_pressure_dia,
      respiratory_rate:  vitals?.respiratory_rate,
      spo2:              vitals?.spo2,
      temperature:       vitals?.temperature,
      glucose:           vitals?.glucose,
      creatinine:        vitals?.creatinine,
      wbc:               vitals?.wbc,
      lactate:           vitals?.lactate,
      timestamp:         timestamp ? new Date(timestamp * 1000).toISOString() : null,
    },
  };
}
