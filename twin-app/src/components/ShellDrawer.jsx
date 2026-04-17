import React from 'react';

export default function ShellDrawer({ open, title, subtitle, onClose, children }) {
  if (!open) return null;

  return (
    <div className="shell-drawer-overlay" onClick={onClose}>
      <aside className="shell-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="shell-drawer__header">
          <div>
            <div className="shell-drawer__eyebrow">{title}</div>
            {subtitle && <h2>{subtitle}</h2>}
          </div>
          <button type="button" className="shell-drawer__close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="shell-drawer__content">{children}</div>
      </aside>
    </div>
  );
}
