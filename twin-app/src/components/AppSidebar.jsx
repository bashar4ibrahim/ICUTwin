import React from 'react';

const formatRole = (role) =>
  String(role || 'clinician')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AppSidebar({
  groups = [],
  activeId,
  onNavigate,
  user,
  onLogout,
  open = false,
  onClose,
}) {
  return (
    <>
      <button
        type="button"
        className={`dashboard-sidebar__backdrop${open ? ' is-open' : ''}`}
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className={`dashboard-sidebar__panel${open ? ' is-open' : ''}`}>
        <div className="dashboard-sidebar">
          <div className="dashboard-sidebar__brand">
            <div className="dashboard-sidebar__brand-mark">AI</div>
            <div className="dashboard-sidebar__brand-copy">
              <strong>ICU Digital Twin</strong>
              <span>Horizon clinical workspace</span>
            </div>
            <button type="button" className="dashboard-sidebar__close" onClick={onClose}>
              Close
            </button>
          </div>

          <div className="dashboard-sidebar__status">
            <span className="dashboard-sidebar__status-dot" />
            <span>Live sync active</span>
          </div>

          <nav className="dashboard-sidebar__nav" aria-label="Primary">
            {groups.map((group) => (
              <section key={group.group} className="dashboard-sidebar__group">
                <div className="dashboard-sidebar__heading">{group.group}</div>
                <div className="dashboard-sidebar__items">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`dashboard-sidebar__item${item.id === activeId ? ' is-active' : ''}`}
                      onClick={() => {
                        onNavigate(item.id);
                        onClose?.();
                      }}
                    >
                      <span className="dashboard-sidebar__item-icon">{item.icon}</span>
                      <span className="dashboard-sidebar__item-copy">
                        <strong>{item.label}</strong>
                        <span>{item.shortLabel}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </nav>

          <div className="dashboard-sidebar__footer">
            <div className="dashboard-sidebar__user">
              <span className="dashboard-sidebar__avatar">
                {user?.full_name?.slice(0, 1).toUpperCase() || 'D'}
              </span>
              <span className="dashboard-sidebar__user-copy">
                <strong>{user?.full_name || 'Doctor'}</strong>
                <span>{formatRole(user?.role)}</span>
              </span>
            </div>
            <button type="button" className="dashboard-sidebar__logout" onClick={onLogout}>
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
