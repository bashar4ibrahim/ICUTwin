import React from 'react';
import './Timeline.css';
import { formatDateTime, RISK_COLOR } from '../../app/shared';

/**
 * Enhanced Timeline Component for Patient Clinical Events
 * Displays:
 * - Patient admission
 * - AI prediction history with risk trends
 * - Vital signs milestones
 * - Clinical interventions
 */
function Timeline({ patient, vitalsHistory = [], patientHistory = [] }) {
  if (!patient) return null;

  // Combine and sort all events chronologically
  const buildTimelineEvents = () => {
    const events = [];

    // 1. Admission event
    if (patient.admitted_at) {
      events.push({
        id: 'admission',
        timestamp: patient.admitted_at,
        type: 'admission',
        icon: '🏥',
        title: 'Patient Admitted',
        description: patient.diagnosis || 'Initial ICU admission',
        details: `Bed ID: ${patient.bed_id || 'N/A'} • Age: ${patient.age}y`,
        severity: 'info',
      });
    }

    // 2. AI Prediction history events
    if (patientHistory && patientHistory.length > 0) {
      patientHistory.forEach((prediction, idx) => {
        const riskPercent = prediction.risk?.riskPercentage || 0;
        const riskLabel = prediction.risk?.label || 'Unknown';
        let severity = 'info';

        if (riskPercent >= 70) severity = 'critical';
        else if (riskPercent >= 50) severity = 'warning';
        else if (riskPercent >= 30) severity = 'caution';
        else severity = 'stable';

        events.push({
          id: `prediction-${idx}`,
          timestamp: prediction.generatedAt || new Date(),
          type: 'prediction',
          icon: '🤖',
          title: 'AI Clinical Assessment',
          description: `${riskLabel} Risk Level Detected`,
          details: `Risk Score: ${riskPercent}% • ${prediction.top_factor || 'Monitoring ongoing'}`,
          severity,
          riskPercent,
          recommendations: prediction.recommendations?.slice(0, 2) || [],
        });
      });
    }

    // 3. Vital signs milestones (every 4-5 readings for better spacing)
    if (vitalsHistory && vitalsHistory.length > 0) {
      const step = Math.max(1, Math.floor(vitalsHistory.length / 5));
      for (let i = 0; i < vitalsHistory.length; i += step) {
        const vital = vitalsHistory[i];
        if (!vital.timestamp) continue;

        let vitalSeverity = 'stable';
        const hr = vital.heart_rate;
        const spo2 = vital.spo2;

        if ((hr && hr > 120) || (spo2 && spo2 < 90)) {
          vitalSeverity = 'warning';
        } else if ((hr && hr > 130) || (spo2 && spo2 < 85)) {
          vitalSeverity = 'critical';
        }

        events.push({
          id: `vitals-${i}`,
          timestamp: vital.timestamp,
          type: 'vitals',
          icon: '📊',
          title: 'Vital Signs Update',
          description: `HR: ${hr || '--'} bpm | SpO₂: ${spo2 || '--'}%`,
          details: `BP: ${vital.blood_pressure_sys || '--'}/${vital.blood_pressure_dia || '--'} | RR: ${vital.respiratory_rate || '--'} | Temp: ${vital.temperature || '--'}°C`,
          severity: vitalSeverity,
        });
      }
    }

    // Sort by timestamp descending (newest first)
    return events.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  };

  const events = buildTimelineEvents();

  const getSeverityBadgeClass = (severity) => {
    const map = {
      critical: 'badge-danger',
      warning: 'badge-warning',
      caution: 'badge-warning',
      stable: 'badge-success',
      info: 'badge-primary',
    };
    return map[severity] || 'badge-info';
  };

  const getSeverityColor = (severity) => {
    const map = {
      critical: '#dc3545',
      warning: '#ffc107',
      caution: '#ff9800',
      stable: '#28a745',
      info: '#007bff',
    };
    return map[severity] || '#0ea5e9';
  };

  return (
    <div className="timeline-wrapper">
      <div className="timeline-header">
        <h3 className="timeline-title">Clinical Timeline</h3>
        <p className="timeline-subtitle">{events.length} events recorded</p>
      </div>

      {events.length === 0 ? (
        <div className="timeline-empty">
          <p>No clinical events recorded yet</p>
        </div>
      ) : (
        <div className="timeline-container">
          {events.map((event, idx) => (
            <div
              key={event.id}
              className={`timeline-event timeline-event--${event.type} timeline-event--${event.severity}`}
            >
              {/* Timeline dot */}
              <div className="timeline-event__marker">
                <div className="timeline-event__dot">
                  <i className={`badge badge-dot badge-dot-xl ${getSeverityBadgeClass(event.severity)}`}></i>
                </div>
              </div>

              {/* Timeline content */}
              <div className="timeline-event__content">
                {/* Timestamp */}
                <div className="timeline-event__time">
                  {formatDateTime(event.timestamp)}
                </div>

                {/* Main content */}
                <div className="timeline-event__body">
                  <div className="timeline-event__header">
                    <span className="timeline-event__icon">{event.icon}</span>
                    <h4 className="timeline-event__title">{event.title}</h4>
                  </div>

                  <p className="timeline-event__description">{event.description}</p>
                  <p className="timeline-event__details">{event.details}</p>

                  {/* Risk-specific insights */}
                  {event.type === 'prediction' && event.riskPercent !== undefined && (
                    <div className="timeline-event__risk-box">
                      <div className="risk-score">
                        <span className="risk-label">Risk Score:</span>
                        <span
                          className="risk-value"
                          style={{ color: RISK_COLOR(event.riskPercent) }}
                        >
                          {event.riskPercent}%
                        </span>
                      </div>
                      {event.recommendations && event.recommendations.length > 0 && (
                        <div className="risk-recommendations">
                          <span className="rec-label">Key Actions:</span>
                          <ul>
                            {event.recommendations.map((rec, i) => (
                              <li key={i}>{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vitals-specific insights */}
                  {event.type === 'vitals' && event.severity !== 'stable' && (
                    <div className="timeline-event__alert" style={{ borderLeftColor: getSeverityColor(event.severity) }}>
                      <span className="alert-icon">⚠️</span>
                      <span className="alert-text">
                        {event.severity === 'critical'
                          ? 'Critical vitals detected - Immediate attention required'
                          : 'Abnormal vitals detected - Review recommended'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {idx < events.length - 1 && <div className="timeline-event__line"></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Timeline;
