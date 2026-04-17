import React from 'react';

export default function SurfaceCard({ title, eyebrow, actions = null, className = '', children }) {
  return (
    <article className={`surface-card${className ? ` ${className}` : ''}`}>
      {(title || eyebrow || actions) && (
        <header className="surface-card__header">
          <div>
            {eyebrow && <div className="surface-card__eyebrow">{eyebrow}</div>}
            {title && <h3 className="surface-card__title">{title}</h3>}
          </div>
          {actions}
        </header>
      )}
      <div className="surface-card__body">{children}</div>
    </article>
  );
}
