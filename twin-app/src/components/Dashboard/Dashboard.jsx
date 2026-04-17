import React, { useEffect, useMemo, useRef, useState } from 'react';
import './Dashboard.css';
import {
  apiFetch,
  formatDateTime,
  getRiskTone,
  RISK_COLOR,
  AVT_COLORS,
} from '../../app/shared';
import { useClinicalIntelligence } from '../ClinicalIntelligenceProvider/ClinicalIntelligenceProvider';
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton';
import EmptyState from '../EmptyState/EmptyState';
import ErrorBanner from '../ErrorBanner/ErrorBanner';
import ApexChart from '../../horizon/components/charts/ReactApexChart';

const clampPercent = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const target = Number(value) || 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count}</span>;
};

const SignalPill = ({ label, value, tone = 'info' }) => (
  <div className={`signal-pill signal-pill-${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

const MiniStatCard = ({
  label,
  value,
  max,
  trend,
  sparklineData,
  color,
  note,
  icon,
}) => {
  const trendValue = trend ? (trend > 0 ? `+${trend}%` : `${trend}%`) : null;
  const sparkSeries = [{ data: sparklineData || [] }];
  const sparkOptions = {
    chart: {
      type: 'line',
      sparkline: { enabled: true },
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 350 },
      parentHeightOffset: 0,
    },
    stroke: { curve: 'smooth', width: 2.6 },
    colors: [color],
    fill: { opacity: 0 },
    tooltip: { enabled: false },
    grid: { show: false },
    dataLabels: { enabled: false },
    xaxis: {
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { show: false },
  };

  return (
    <div className="stat-card-mini" style={{ '--stat-accent': color }}>
      <div className="stat-card-top">
        <div>
          <div className="stat-label">{label}</div>
          {note && <div className="stat-note">{note}</div>}
        </div>
        <div className="stat-icon">{icon}</div>
      </div>
      <div className="stat-value-row">
        <div className="stat-value">
          <AnimatedCounter value={value} />
          {max !== undefined && <span className="stat-max">/{max}</span>}
        </div>
        {trend !== undefined && (
          <div className={`stat-trend ${trend > 0 ? 'trend-up' : 'trend-down'}`}>
            {trend > 0 ? 'UP' : 'DOWN'} {trendValue}
          </div>
        )}
      </div>
      <div className="stat-sparkline">
        <ApexChart options={sparkOptions} series={sparkSeries} type="line" height={58} />
      </div>
    </div>
  );
};

const RadarChart = ({ data }) => {
  const labels = (data || []).map((item) => item.category);
  const values = (data || []).map((item) => Number(item.value) || 0);
  const maxValue = Math.max(...((data || []).map((item) => Number(item.full) || 10)), 10);
  const radarSeries = [{ name: 'Current', data: values }];
  const radarOptions = {
    chart: {
      type: 'radar',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 400 },
      parentHeightOffset: 0,
    },
    labels,
    stroke: { width: 2.6, colors: ['#0ea5e9'] },
    fill: { opacity: 0.22, colors: ['#0ea5e9'] },
    markers: {
      size: 4,
      colors: ['#0ea5e9'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
    },
    dataLabels: { enabled: false },
    tooltip: { theme: 'light' },
    yaxis: {
      min: 0,
      max: maxValue,
      tickAmount: Math.min(maxValue, 5),
      labels: { style: { colors: '#64748b', fontSize: '10px' } },
    },
    xaxis: {
      labels: {
        style: {
          colors: Array(labels.length).fill('#475569'),
          fontSize: '11px',
          fontFamily: 'Instrument Sans',
        },
      },
    },
    plotOptions: {
      radar: {
        polygons: {
          strokeColors: '#dbeafe',
          connectorColors: '#dbeafe',
          fill: { colors: ['#f8fbff', '#ffffff'] },
        },
      },
    },
  };

  return <ApexChart options={radarOptions} series={radarSeries} type="radar" height={250} />;
};

const LineChartCard = ({
  title,
  data,
  labels,
  color = '#0ea5e9',
  badgeLabel = 'Live',
  insight,
}) => {
  const lineSeries = [{ name: title, data: data || [] }];
  const lineOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 450 },
      parentHeightOffset: 0,
      zoom: { enabled: false },
    },
    colors: [color],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.7 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.28,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    tooltip: { theme: 'light' },
    grid: { borderColor: '#dbe5f1', strokeDashArray: 4 },
    xaxis: {
      categories: labels && labels.length ? labels : (data || []).map((_, i) => i + 1),
      labels: {
        style: { colors: '#64748b', fontSize: '10px' },
        rotate: -24,
        hideOverlappingLabels: true,
      },
      axisBorder: { color: '#dbe5f1' },
      axisTicks: { color: '#dbe5f1' },
    },
    yaxis: {
      labels: { style: { colors: '#64748b', fontSize: '10px' } },
    },
    legend: { show: false },
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">{title}</span>
        <span className="badge badge-info">{badgeLabel}</span>
      </div>
      <div className="chart-viewport">
        <ApexChart options={lineOptions} series={lineSeries} type="area" height={220} />
      </div>
      {insight && <div className="chart-note">{insight}</div>}
    </div>
  );
};

const AlertMixCard = ({ criticalCount, warningCount, stableCount }) => {
  const total = criticalCount + warningCount + stableCount;

  if (!total) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <span className="chart-title">Alert Mix</span>
          <span className="badge badge-success">Calm</span>
        </div>
        <EmptyState icon="AI" message="No alert pressure detected right now." />
      </div>
    );
  }

  const series = [criticalCount, warningCount, stableCount];
  const options = {
    chart: {
      type: 'donut',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 350 },
    },
    labels: ['Critical', 'Elevated', 'Stable'],
    colors: ['#fb7185', '#f59e0b', '#14b8a6'],
    stroke: { width: 0 },
    legend: { show: false },
    dataLabels: { enabled: false },
    tooltip: { theme: 'light' },
    plotOptions: {
      pie: {
        donut: {
          size: '76%',
          labels: {
            show: true,
            name: {
              show: true,
              fontFamily: 'Instrument Sans',
              fontSize: '12px',
              color: '#64748b',
              offsetY: 18,
            },
            value: {
              show: true,
              fontFamily: 'Syne',
              fontSize: '32px',
              fontWeight: 800,
              color: '#0f172a',
              offsetY: -10,
              formatter: () => `${total}`,
            },
            total: {
              show: true,
              label: 'Total alerts',
              fontFamily: 'Instrument Sans',
              color: '#64748b',
              formatter: () => '',
            },
          },
        },
      },
    },
  };

  const legendItems = [
    { label: 'Critical', value: criticalCount, tone: 'critical' },
    { label: 'Elevated', value: warningCount, tone: 'warning' },
    { label: 'Stable', value: stableCount, tone: 'success' },
  ];

  return (
    <div className="chart-card alert-mix-card">
      <div className="chart-header">
        <span className="chart-title">Alert Mix</span>
        <span className="badge badge-critical">{criticalCount} urgent</span>
      </div>
      <div className="alert-mix-layout">
        <div className="alert-mix-chart">
          <ApexChart options={options} series={series} type="donut" height={250} />
        </div>
        <div className="alert-mix-legend">
          {legendItems.map((item) => (
            <div key={item.label} className={`alert-legend-item tone-${item.tone}`}>
              <div>
                <div className="alert-legend-label">{item.label}</div>
                <div className="alert-legend-caption">
                  {item.value > 0 ? 'Active in the current feed' : 'No current signal'}
                </div>
              </div>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ResourceBalanceCard = ({
  bedCapacityPct,
  ventUsagePct,
  predictionCoveragePct,
  stablePatientsPct,
}) => {
  const series = [
    {
      name: 'Current',
      data: [bedCapacityPct, ventUsagePct, predictionCoveragePct, stablePatientsPct],
    },
  ];

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      animations: { enabled: true, easing: 'easeinout', speed: 350 },
      parentHeightOffset: 0,
    },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 10,
        barHeight: '54%',
        distributed: true,
      },
    },
    colors: ['#38bdf8', '#f59e0b', '#14b8a6', '#8b5cf6'],
    dataLabels: {
      enabled: true,
      formatter: (value) => `${Math.round(value)}%`,
      style: {
        colors: ['#0f172a'],
        fontFamily: 'DM Mono',
        fontWeight: 600,
      },
    },
    grid: {
      borderColor: '#edf2f7',
      strokeDashArray: 4,
      xaxis: { lines: { show: true } },
    },
    legend: { show: false },
    tooltip: { theme: 'light' },
    xaxis: {
      max: 100,
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '10px',
        },
      },
    },
    yaxis: {
      categories: ['Beds in use', 'Vents in use', 'AI coverage', 'Stable vitals'],
      labels: {
        style: {
          colors: '#475569',
          fontSize: '11px',
          fontFamily: 'Instrument Sans',
          fontWeight: 600,
        },
      },
    },
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <span className="chart-title">Operational Balance</span>
        <span className="badge badge-info">Shift-ready</span>
      </div>
      <div className="chart-viewport">
        <ApexChart options={options} series={series} type="bar" height={250} />
      </div>
      <div className="chart-note">
        Capacity, device load, AI reach, and patient stability are aligned in one view for quick staffing decisions.
      </div>
    </div>
  );
};

const SectionDivider = ({ label }) => (
  <div className="section-divider">
    <span className="section-divider-label">{label}</span>
    <div className="section-divider-line" />
  </div>
);

const RiskTrajectoryMap = ({ patients, predictions, predictionHistory }) => {
  const svgRef = useRef(null);
  const [hoveredPatient, setHoveredPatient] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const trajectoryData = useMemo(() => {
    return patients
      .map((patient) => {
        const preds = predictionHistory[patient.patient_id] || [];
        const currentPred = predictions[patient.patient_id];
        const currentRisk = Number(currentPred?.risk?.riskPercentage);
        if (!currentPred || !Number.isFinite(currentRisk) || preds.length < 1) return null;

        const allPreds = [...preds, currentPred]
          .filter((item) => {
            const time = new Date(item?.generatedAt).getTime();
            const risk = Number(item?.risk?.riskPercentage);
            return Number.isFinite(time) && Number.isFinite(risk);
          })
          .sort((a, b) => new Date(a.generatedAt) - new Date(b.generatedAt));

        const recentPreds = allPreds.slice(-8);
        if (recentPreds.length < 2) return null;

        const firstTime = new Date(recentPreds[0].generatedAt).getTime();
        const points = recentPreds
          .map((item) => ({
            time: (new Date(item.generatedAt).getTime() - firstTime) / (1000 * 60 * 60),
            risk: Number(item.risk.riskPercentage),
            label: item.risk.label,
          }))
          .filter((point) => Number.isFinite(point.time) && Number.isFinite(point.risk));

        if (points.length < 2) return null;

        return {
          patientId: patient.patient_id,
          name: patient.name,
          bed: patient.bed_id,
          currentRisk,
          riskLabel: currentPred.risk.label,
          points,
          color: RISK_COLOR(currentRisk),
        };
      })
      .filter(Boolean);
  }, [patients, predictions, predictionHistory]);

  const { xScale, yScale, maxTime } = useMemo(() => {
    if (!trajectoryData.length) {
      return { xScale: null, yScale: null, maxTime: 1 };
    }

    let maxT = 0;
    trajectoryData.forEach((item) => {
      item.points.forEach((point) => {
        if (point.time > maxT) maxT = point.time;
      });
    });
    maxT = Math.max(maxT, 1);

    return {
      maxTime: maxT,
      xScale: (time) => 55 + (time / maxT) * 700,
      yScale: (risk) => 175 - (risk / 100) * 140,
    };
  }, [trajectoryData]);

  const handleMouseMove = (event, patient) => {
    const rect = svgRef.current.getBoundingClientRect();
    setTooltipPos({ x: event.clientX - rect.left + 20, y: event.clientY - rect.top - 20 });
    setHoveredPatient(patient);
  };

  if (!trajectoryData.length) {
    return (
      <div className="chart-card">
        <div className="chart-header">
          <span className="chart-title">Risk Trajectory Map</span>
          <span className="badge badge-info">0 patients</span>
        </div>
        <EmptyState icon="AI" message="No prediction history is available yet." />
      </div>
    );
  }

  return (
    <div className="chart-card trajectory-card">
      <div className="chart-header">
        <span className="chart-title">Risk Trajectory Map</span>
        <div className="trajectory-card-head">
          <span className="badge badge-info">{trajectoryData.length} patients</span>
          <span className="live-indicator">
            <span className="live-dot" /> real-time
          </span>
        </div>
      </div>
      <div className="trajectory-note">
        Track whether predicted deterioration is settling down or accelerating across the latest ICU window.
      </div>
      <div className="trajectory-stage">
        <svg
          ref={svgRef}
          viewBox="0 0 800 210"
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', height: 'auto' }}
        >
          <defs>
            {trajectoryData.map((patient) => (
              <linearGradient
                key={`g-${patient.patientId}`}
                id={`tg-${patient.patientId}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={patient.color} stopOpacity="0.14" />
                <stop offset="100%" stopColor={patient.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>

          <rect x="55" y="35" width="700" height="56" fill="rgba(251,113,133,0.08)" rx="8" />
          <rect x="55" y="91" width="700" height="56" fill="rgba(245,158,11,0.07)" rx="8" />
          <rect x="55" y="147" width="700" height="28" fill="rgba(20,184,166,0.08)" rx="8" />
          <text x="758" y="65" fill="rgba(244,63,94,0.62)" fontSize="8" textAnchor="end">CRITICAL</text>
          <text x="758" y="121" fill="rgba(217,119,6,0.62)" fontSize="8" textAnchor="end">HIGH</text>
          <text x="758" y="165" fill="rgba(13,148,136,0.62)" fontSize="8" textAnchor="end">LOW</text>

          {[0, 25, 50, 75, 100].map((risk) => (
            <g key={risk}>
              <line
                x1="55"
                y1={175 - (risk / 100) * 140}
                x2="755"
                y2={175 - (risk / 100) * 140}
                stroke="#d9e6f2"
                strokeDasharray="4 4"
                strokeWidth="0.75"
              />
              <text
                x="48"
                y={175 - (risk / 100) * 140 + 4}
                fontSize="8"
                fill="#94a3b8"
                textAnchor="end"
              >
                {risk}%
              </text>
            </g>
          ))}

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={ratio}
              x1={55 + ratio * 700}
              y1="35"
              x2={55 + ratio * 700}
              y2="175"
              stroke="#d9e6f2"
              strokeDasharray="4 4"
              strokeWidth="0.75"
            />
          ))}

          <text x="400" y="202" fontSize="9" fill="#94a3b8" textAnchor="middle">
            Time window / {maxTime.toFixed(1)} hrs
          </text>

          {trajectoryData.map((patient) => {
            const points = patient.points
              .map((point) => ({ ...point, cx: xScale(point.time), cy: yScale(point.risk) }))
              .filter((point) => Number.isFinite(point.cx) && Number.isFinite(point.cy));

            if (points.length < 2) return null;

            const path = points
              .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.cx} ${point.cy}`)
              .join(' ');
            const area = `${path} L ${points[points.length - 1].cx} 175 L ${points[0].cx} 175 Z`;

            return (
              <g key={patient.patientId}>
                <path d={area} fill={`url(#tg-${patient.patientId})`} />
                <path
                  d={path}
                  fill="none"
                  stroke={patient.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: `drop-shadow(0 0 5px ${patient.color}44)` }}
                />
                {points.map((point, index) => (
                  <circle
                    key={index}
                    cx={point.cx}
                    cy={point.cy}
                    r={index === points.length - 1 ? '6' : '3'}
                    fill={index === points.length - 1 ? patient.color : '#ffffff'}
                    stroke={patient.color}
                    strokeWidth="2"
                    style={{
                      cursor: 'pointer',
                      filter: index === points.length - 1 ? `drop-shadow(0 0 6px ${patient.color})` : 'none',
                    }}
                    onMouseEnter={(event) => handleMouseMove(event, patient)}
                    onMouseLeave={() => setHoveredPatient(null)}
                  />
                ))}
              </g>
            );
          })}
        </svg>
        {hoveredPatient && (
          <div className="trajectory-tooltip" style={{ left: tooltipPos.x, top: tooltipPos.y }}>
            <div className="trajectory-tooltip-name" style={{ color: hoveredPatient.color }}>
              {hoveredPatient.name}
            </div>
            <div className="trajectory-tooltip-bed">Bed {hoveredPatient.bed}</div>
            <div className="trajectory-tooltip-risk">
              Risk <strong style={{ color: hoveredPatient.color }}>{hoveredPatient.currentRisk}%</strong>
              <span> / {hoveredPatient.riskLabel}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function Dashboard({ onNav, user }) {
  const {
    registerPatients,
    predictions,
    history: predictionHistory,
    alerts: modelAlerts,
  } = useClinicalIntelligence();

  const [patients, setPatients] = useState([]);
  const [resources, setResources] = useState([]);
  const [aiAlerts, setAiAlerts] = useState([]);
  const [criticalVitals, setCriticalVitals] = useState([]);
  const [vitalsHistory, setVitalsHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/icu/patients'),
      apiFetch('/icu/resources'),
      apiFetch('/icu/ai/alerts'),
      apiFetch('/icu/vitals/critical'),
    ])
      .then(([patientResponse, resourceResponse, alertResponse, criticalResponse]) => {
        setPatients(patientResponse.patients || []);
        setResources(resourceResponse.resources || []);
        setAiAlerts(alertResponse.alerts || []);
        setCriticalVitals(criticalResponse.patients || []);
        registerPatients(patientResponse.patients || [], 'dashboard');

        if (patientResponse.patients?.length > 0) {
          return apiFetch(`/icu/vitals/${patientResponse.patients[0].patient_id}/history?limit=20`);
        }

        return null;
      })
      .then((vitalsResponse) => {
        if (vitalsResponse?.readings) setVitalsHistory(vitalsResponse.readings);
      })
      .catch((fetchError) => setError(fetchError.message))
      .finally(() => setLoading(false));
  }, [registerPatients]);

  if (loading) return <LoadingSkeleton lines={8} />;

  const beds = resources.filter((resource) => resource.type === 'bed');
  const occupiedBeds = beds.filter((resource) => resource.status === 'occupied').length;
  const vents = resources.filter((resource) => resource.type === 'ventilator');
  const ventInUse = vents.filter((resource) => resource.status === 'in_use').length;
  const combinedAlerts = [...modelAlerts, ...aiAlerts].sort(
    (left, right) => (Number(right.risk_score) || 0) - (Number(left.risk_score) || 0),
  );
  const autoPredictions = patients.filter((patient) => predictions[patient.patient_id]).length;

  const spark1 = [5, 8, 7, 9, 8, 10, 9, 11];
  const spark2 = [2, 3, 1, 4, 2, 3, 2, 4];
  const spark3 = [8, 10, 12, 15, 18, 20, 22, 25];
  const spark4 = [4, 5, 4, 6, 5, 7, 6, 8];
  const spark5 = [3, 5, 4, 6, 8, 7, 9, 10];

  const hrData = vitalsHistory.map((reading) => reading.heart_rate).filter((value) => value != null);
  const hrLabels = vitalsHistory.map((reading) =>
    new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );

  const radarData = [
    { category: 'Telemetry', value: 9, full: 10 },
    { category: 'AI Accuracy', value: 8.5, full: 10 },
    { category: 'Response', value: 9.2, full: 10 },
    { category: 'Uptime', value: 9.8, full: 10 },
    { category: 'Security', value: 8.8, full: 10 },
  ];

  const timelineEvents = combinedAlerts.slice(0, 5).map((alert) => ({
    time: formatDateTime(alert.created_at || alert.generated_at || new Date()),
    title: `${alert.name || 'Patient'} - Risk ${Math.round(Number(alert.risk_score) || 0)}`,
    desc: alert.top_factor || alert.category || 'Clinical signal updated.',
    critical: Number(alert.risk_score) >= 70,
  }));

  const riskScores = patients
    .map((patient) => Number(predictions[patient.patient_id]?.risk?.riskPercentage))
    .filter((value) => Number.isFinite(value));
  const avgRisk = riskScores.length
    ? Math.round(riskScores.reduce((sum, value) => sum + value, 0) / riskScores.length)
    : 0;
  const highRiskCount = riskScores.filter((value) => value >= 70).length;
  const warningRiskCount = riskScores.filter((value) => value >= 40 && value < 70).length;
  const lowRiskCount = riskScores.filter((value) => value < 40).length;

  const criticalAlertCount = combinedAlerts.filter((alert) => Number(alert.risk_score) >= 70).length;
  const warningAlertCount = combinedAlerts.filter((alert) => {
    const score = Number(alert.risk_score) || 0;
    return score >= 40 && score < 70;
  }).length;
  const stableAlertCount = Math.max(0, combinedAlerts.length - criticalAlertCount - warningAlertCount);

  const bedCapacityPct = clampPercent(beds.length ? (occupiedBeds / beds.length) * 100 : 0);
  const ventUsagePct = clampPercent(vents.length ? (ventInUse / vents.length) * 100 : 0);
  const predictionCoveragePct = clampPercent(
    patients.length ? (autoPredictions / patients.length) * 100 : 0,
  );
  const stablePatientsPct = clampPercent(
    patients.length ? ((patients.length - criticalVitals.length) / patients.length) * 100 : 0,
  );

  const operationalScore = clampPercent(
    62 +
      predictionCoveragePct * 0.18 +
      stablePatientsPct * 0.12 -
      bedCapacityPct * 0.08 -
      ventUsagePct * 0.06 -
      criticalAlertCount * 2 -
      highRiskCount * 1.5,
  );

  const operationalLabel =
    operationalScore >= 85
      ? 'Unit rhythm is strong'
      : operationalScore >= 70
        ? 'Pressure is manageable'
        : 'Triage attention needed';

  const focusPatients = patients
    .map((patient) => {
      const prediction = predictions[patient.patient_id];
      const riskScore = Number(prediction?.risk?.riskPercentage);
      if (!Number.isFinite(riskScore)) return null;

      return {
        patientId: patient.patient_id,
        name: patient.name,
        bed: patient.bed_id,
        diagnosis: patient.diagnosis,
        riskScore,
        riskLabel: prediction?.risk?.label || 'Observed',
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.riskScore - left.riskScore)
    .slice(0, 5);

  const greetingName = user?.name?.split(' ')?.[0] || 'Team';
  const openBeds = Math.max(beds.length - occupiedBeds, 0);
  const readyVents = Math.max(vents.length - ventInUse, 0);

  return (
    <div className="dashboard-root">
      {error && <ErrorBanner msg={error} />}

      {combinedAlerts.length > 0 && (
        <div className="alert-ticker">
          <div className="ticker-content">
            {[...combinedAlerts, ...combinedAlerts].map((alert, index) => (
              <span key={`${alert.name || 'alert'}-${index}`}>
                Alert / {alert.name || 'Patient'} / risk {Math.round(Number(alert.risk_score) || 0)} /{' '}
                {alert.category || 'AI signal'} <i>+</i>
              </span>
            ))}
          </div>
        </div>
      )}

      <section className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <div className="dashboard-kicker">AI ICU orchestration</div>
          <h1>{greetingName}, here is the clearest live picture of the unit.</h1>
          <p>
            The dashboard now brings capacity, risk momentum, and patient stability into one lighter
            command deck so employees can spot action points in seconds.
          </p>

          <div className="hero-pill-row">
            <SignalPill
              label="Average risk"
              value={`${avgRisk}%`}
              tone={avgRisk >= 70 ? 'critical' : avgRisk >= 40 ? 'warning' : 'info'}
            />
            <SignalPill label="Prediction reach" value={`${predictionCoveragePct}%`} tone="success" />
            <SignalPill label="Critical watch" value={`${highRiskCount} patients`} tone="critical" />
          </div>

          <div className="hero-action-row">
            <button className="btn btn-primary" onClick={() => onNav('ai')}>
              Open AI Risk Engine
            </button>
            <button className="btn btn-ghost" onClick={() => onNav('patients')}>
              Review patient census
            </button>
          </div>
        </div>

        <div className="dashboard-hero-visual">
          <div className="hero-score-panel">
            <div className="hero-score-head">
              <span className="hero-panel-label">Operational pulse</span>
              <span className="badge badge-info">Shift snapshot</span>
            </div>
            <div className="hero-score-value">{operationalScore}</div>
            <div className="hero-score-caption">{operationalLabel}</div>
            <div className="hero-meter">
              <div className="hero-meter-fill" style={{ width: `${operationalScore}%` }} />
            </div>
            <div className="hero-mini-grid">
              <div className="hero-metric-card tone-sky">
                <span>Open beds</span>
                <strong>{openBeds}</strong>
                <small>ready for immediate intake</small>
              </div>
              <div className="hero-metric-card tone-mint">
                <span>Stable vitals</span>
                <strong>{stablePatientsPct}%</strong>
                <small>patients outside critical watch</small>
              </div>
              <div className="hero-metric-card tone-gold">
                <span>Vent reserve</span>
                <strong>{readyVents}</strong>
                <small>devices available now</small>
              </div>
              <div className="hero-metric-card tone-violet">
                <span>Alert pressure</span>
                <strong>{combinedAlerts.length}</strong>
                <small>signals across AI and live feeds</small>
              </div>
            </div>
          </div>
          <div className="hero-floating-note">
            {criticalAlertCount > 0
              ? `${criticalAlertCount} critical alerts are shaping the current response load.`
              : 'No critical alert spike is dominating the board right now.'}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-5 dashboard-kpi-grid">
        <MiniStatCard
          label="Beds occupied"
          value={occupiedBeds}
          max={beds.length}
          trend={5.2}
          sparklineData={spark1}
          color="#38bdf8"
          note={`${openBeds} bays still open`}
          icon="B"
        />
        <MiniStatCard
          label="Critical vitals"
          value={criticalVitals.length}
          trend={-2.1}
          sparklineData={spark2}
          color="#fb7185"
          note="monitoring urgent instability"
          icon="V"
        />
        <MiniStatCard
          label="AI predictions"
          value={autoPredictions}
          trend={12.5}
          sparklineData={spark3}
          color="#14b8a6"
          note={`${predictionCoveragePct}% patient coverage`}
          icon="AI"
        />
        <MiniStatCard
          label="Ventilators"
          value={ventInUse}
          max={vents.length}
          trend={3.8}
          sparklineData={spark4}
          color="#f59e0b"
          note={`${readyVents} still available`}
          icon="O2"
        />
        <MiniStatCard
          label="Active alerts"
          value={combinedAlerts.length}
          trend={8.1}
          sparklineData={spark5}
          color="#8b5cf6"
          note={`${criticalAlertCount} currently critical`}
          icon="!"
        />
      </div>

      <SectionDivider label="Insight Mosaic" />

      <div className="dashboard-mosaic-grid">
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">System Performance</span>
            <span className="badge badge-info">Radar</span>
          </div>
          <RadarChart data={radarData} />
          <div className="chart-note">
            Telemetry quality, AI confidence, response pace, uptime, and security stay visible in one premium frame.
          </div>
        </div>

        <LineChartCard
          title="Heart Rate Trend"
          data={hrData}
          labels={hrLabels}
          color="#fb7185"
          badgeLabel="Telemetry"
          insight={
            hrData.length
              ? `${hrData.length} recent readings are shaping the live trend line.`
              : 'No heart-rate stream is available yet.'
          }
        />

        <AlertMixCard
          criticalCount={criticalAlertCount}
          warningCount={warningAlertCount}
          stableCount={stableAlertCount}
        />
      </div>

      <SectionDivider label="Operational Focus" />

      <div className="dashboard-focus-grid">
        <ResourceBalanceCard
          bedCapacityPct={bedCapacityPct}
          ventUsagePct={ventUsagePct}
          predictionCoveragePct={predictionCoveragePct}
          stablePatientsPct={stablePatientsPct}
        />
        <div className="digital-twin-panel">
          <div className="chart-header">
            <span className="chart-title">Digital Twin Intelligence</span>
            <span className="live-indicator">
              <span className="live-dot" /> active
            </span>
          </div>
          <div className="digital-twin-copy">
            Model confidence stays high while the unit keeps prediction coverage broad enough for practical bedside escalation.
          </div>
          <div className="data-row">
            <span className="data-row-label">Model confidence</span>
            <span className="data-row-value">94%</span>
          </div>
          <div className="confidence-meter">
            <div className="confidence-fill" style={{ width: '94%' }} />
          </div>
          <div className="data-row">
            <span className="data-row-label">Predictions today</span>
            <span className="data-row-value">247</span>
          </div>
          <div className="data-row">
            <span className="data-row-label">Escalations triggered</span>
            <span className="data-row-value tone-danger">12</span>
          </div>
          <div className="data-row">
            <span className="data-row-label">System uptime</span>
            <span className="data-row-value tone-success">99.98%</span>
          </div>
          <div className="digital-twin-footer">
            <button className="btn btn-primary" onClick={() => onNav('ai')}>
              Deep dive into AI engine
            </button>
          </div>
        </div>

        <div className="chart-card focus-watch-card">
          <div className="chart-header">
            <span className="chart-title">Priority Watchlist</span>
            <span className="badge badge-warning">{focusPatients.length} tracked</span>
          </div>
          {focusPatients.length ? (
            <div className="focus-watch-list">
              {focusPatients.map((patient, index) => (
                <div
                  key={patient.patientId}
                  className="focus-watch-item"
                  onClick={() => onNav('patients')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') onNav('patients');
                  }}
                >
                  <div
                    className="focus-watch-avatar"
                    style={{
                      background: `linear-gradient(135deg, ${AVT_COLORS[index % AVT_COLORS.length]}, ${AVT_COLORS[(index + 1) % AVT_COLORS.length]})`,
                    }}
                  >
                    {patient.name?.split(' ').map((part) => part[0]).join('')}
                  </div>
                  <div className="focus-watch-main">
                    <div className="focus-watch-topline">
                      <strong>{patient.name}</strong>
                      <span>Bed {patient.bed}</span>
                    </div>
                    <div className="focus-watch-diagnosis">{patient.diagnosis}</div>
                    <div className="focus-watch-bar">
                      <div
                        className="focus-watch-bar-fill"
                        style={{
                          width: `${patient.riskScore}%`,
                          background: `linear-gradient(90deg, ${RISK_COLOR(patient.riskScore)}, ${RISK_COLOR(Math.max(patient.riskScore - 10, 0))})`,
                        }}
                      />
                    </div>
                  </div>
                  <div className={`badge badge-${getRiskTone(patient.riskScore)}`}>
                    {patient.riskLabel}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon="RN" message="No risk-ranked patients are available yet." />
          )}
        </div>
      </div>

      <SectionDivider label="Predictive Flow" />

      <RiskTrajectoryMap
        patients={patients}
        predictions={predictions}
        predictionHistory={predictionHistory}
      />

      <SectionDivider label="Clinical Activity" />

      <div className="dashboard-activity-grid">
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Clinical Timeline</span>
            <span className="badge badge-critical">Live</span>
          </div>
          <div className="timeline">
            {timelineEvents.length > 0 ? (
              timelineEvents.map((event, index) => (
                <div key={`${event.title}-${index}`} className="timeline-item">
                  <div className={`timeline-dot ${event.critical ? 'critical' : 'warning'}`} />
                  <div>
                    <div className="timeline-time">{event.time}</div>
                    <div className="timeline-title">{event.title}</div>
                    <div className="timeline-desc">{event.desc}</div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState icon="LOG" message="No recent events are available." />
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Active ICU Patients</span>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav('patients')}>
              View all
            </button>
          </div>
          <div className="patient-list">
            {patients.slice(0, 6).map((patient, index) => (
              <div
                key={patient.patient_id}
                className="patient-row"
                onClick={() => onNav('patients')}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') onNav('patients');
                }}
              >
                <div
                  className="patient-avatar"
                  style={{
                    background: `linear-gradient(135deg, ${AVT_COLORS[index % AVT_COLORS.length]}, ${AVT_COLORS[(index + 1) % AVT_COLORS.length]})`,
                  }}
                >
                  {patient.name?.split(' ').map((part) => part[0]).join('')}
                </div>
                <div className="patient-main">
                  <div className="patient-name">{patient.name}</div>
                  <div className="patient-meta">
                    {patient.bed_id} / {patient.diagnosis}
                  </div>
                </div>
                {predictions[patient.patient_id] && (
                  <span className={`badge badge-${getRiskTone(predictions[patient.patient_id]?.risk?.riskPercentage || 0)}`}>
                    {predictions[patient.patient_id]?.risk?.label}
                  </span>
                )}
              </div>
            ))}
            {patients.length === 0 && <EmptyState icon="ICU" message="No patients found." />}
          </div>
        </div>
      </div>

      <div className="dashboard-footer-summary">
        <span>{lowRiskCount} low-risk trajectories are stable.</span>
        <span>{warningRiskCount} patients remain under elevated watch.</span>
        <span>{highRiskCount} patients need priority monitoring.</span>
      </div>
    </div>
  );
}

export default Dashboard;
