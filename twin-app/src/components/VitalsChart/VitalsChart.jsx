import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import './VitalsChart.css';

import {
  API_BASE,
  WS_BASE,
  apiFetch,
  getToken,
  resolveServiceUrl,
  CUSTOM_AI_MODEL_ENDPOINT,
  CUSTOM_AI_MODEL_NAME,
  CUSTOM_MODEL_INPUT_GROUPS,
  CUSTOM_MODEL_MOCK_CASES,
  createCustomModelDraft,
  getDefaultCustomModelInputs,
  prepareCustomModelRequest,
  predictCustomAiModel,
  AUTO_PREDICTION_DEBOUNCE_MS,
  CLINICAL_INTELLIGENCE_STORAGE_KEY,
  answerClinicalQuestion,
  assembleAutoModelInputs,
  buildAuditEntry,
  buildEscalation,
  buildPredictionSignature,
  buildSyntheticAlert,
  createPredictionRecord,
  getRiskTone,
  mergePatientSnapshot,
  summarizeTrend,
  AVT_COLORS,
  MODEL_INPUT_LOOKUP,
  CUSTOM_MODEL_ENDPOINT_LABEL,
  formatNumeric,
  formatPercent,
  formatDateTime,
  formatTrendText,
  formatBackendStatus,
  normalizeChatHistory,
  normalizeVitalsPayload,
  riskBadgeTone,
  RISK_COLOR,
  NAV_ITEMS,
  CHART_CONFIGS,
  QUICK_PROMPTS,
} from '../../app/shared';

import * as d3 from 'd3';

function VitalsChart({ data, config, height = 140 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;
    const el = svgRef.current;
    const W = el.clientWidth || 500;
    const H = height;
    const m = { top: 12, right: 16, bottom: 24, left: 40 };

    d3.select(el).selectAll('*').remove();
    const svg = d3.select(el)
      .attr('viewBox', `0 0 ${W} ${H}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => new Date(d.timestamp)))
      .range([m.left, W - m.right]);

    const vals = data.map(d => d[config.key]).filter(v => v != null);
    const ye = d3.extent(vals);
    const yp = (ye[1] - ye[0]) * 0.2 || 5;
    const y = d3.scaleLinear()
      .domain([ye[0] - yp, ye[1] + yp])
      .range([H - m.bottom, m.top]);

    // Grid lines
    svg.append('g')
      .selectAll('line')
      .data(y.ticks(4))
      .join('line')
      .attr('x1', m.left)
      .attr('x2', W - m.right)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', 'rgba(255, 255, 255, 0.06)')
      .attr('stroke-dasharray', '3 3');

    // Normal range background
    if (config.normalRange) {
      svg.append('rect')
        .attr('x', m.left)
        .attr('y', y(config.normalRange[1]))
        .attr('width', W - m.left - m.right)
        .attr('height', y(config.normalRange[0]) - y(config.normalRange[1]))
        .attr('fill', config.color)
        .attr('opacity', 0.08);
    }

    // Area
    svg.append('path')
      .datum(data)
      .attr('fill', config.color)
      .attr('opacity', 0.15)
      .attr('d', d3.area()
        .x(d => x(new Date(d.timestamp)))
        .y0(H - m.bottom)
        .y1(d => y(d[config.key]))
        .curve(d3.curveCatmullRom.alpha(0.5))
      );

    // Line
    const line = d3.line()
      .x(d => x(new Date(d.timestamp)))
      .y(d => y(d[config.key]))
      .curve(d3.curveCatmullRom.alpha(0.5));

    const path = svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', config.color)
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    const length = path.node().getTotalLength();
    path.attr('stroke-dasharray', `${length} ${length}`)
      .attr('stroke-dashoffset', length)
      .transition()
      .duration(1000)
      .ease(d3.easeQuadOut)
      .attr('stroke-dashoffset', 0);

    // Axes
    svg.append('g')
      .attr('transform', `translate(0, ${H - m.bottom})`)
      .call(d3.axisBottom(x).ticks(4).tickFormat(d => d3.timeFormat('%H:%M')(d)))
      .attr('color', 'var(--text-tertiary)')
      .attr('font-size', '9px');

    svg.append('g')
      .attr('transform', `translate(${m.left}, 0)`)
      .call(d3.axisLeft(y).ticks(4))
      .attr('color', 'var(--text-tertiary)')
      .attr('font-size', '9px');
  }, [data, config, height]);

  return <svg ref={svgRef} className="vitals-svg" style={{ width: '100%', height }} />;
}

export default VitalsChart;


