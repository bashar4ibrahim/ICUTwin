import React from 'react';

export default function StatCard({ label, value, tone = 'accent', helper }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <span className="stat-card__label">{label}</span>
      <strong className="stat-card__value">{value}</strong>
      {helper && <p className="stat-card__helper">{helper}</p>}
    </article>
  );
}
