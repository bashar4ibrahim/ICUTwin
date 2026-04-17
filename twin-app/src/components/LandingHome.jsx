import React, { useMemo, useRef, useState } from 'react';

export default function LandingHome({
  onNavigate,
  user,
  modules = [],
  groups = [],
  summary = [],
}) {
  const modulesRef = useRef(null);
  const [activeModuleId, setActiveModuleId] = useState(modules[0]?.id || 'command-center');

  const activeModule = useMemo(
    () => modules.find((item) => item.id === activeModuleId) || modules[0],
    [activeModuleId, modules]
  );

  return (
    <div className="landing-page">
      <section className="landing-page__hero">
        <div className="landing-page__hero-copy">
          <div className="landing-page__eyebrow">
            <span className="live-dot" />
            {`Welcome${user?.full_name ? `, ${user.full_name}` : ''} • The future of ICU command`}
          </div>
          <h1>AI-powered ICU Digital Twin for clinical decisions, live monitoring, and operational control.</h1>
          <p>
            A premium command center that unifies patients, digital twins, predictive intelligence, reports,
            operations, and security into one medically trustworthy platform.
          </p>

          <div className="landing-page__actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => onNavigate('command-center')}>
              Open Dashboard
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              onClick={() => modulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              Explore System
            </button>
          </div>

          <div className="landing-page__summary-grid">
            {summary.map((item) => (
              <div key={item.label} className="landing-page__summary-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.copy}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-page__hero-visual">
          <div className="landing-page__hero-visual-shell" aria-hidden="true">
            <div className="landing-page__hero-orbit landing-page__hero-orbit--outer" />
            <div className="landing-page__hero-orbit landing-page__hero-orbit--inner" />

            <div className="landing-page__hero-core">
              <div className="landing-page__hero-core-mark">AI</div>
              <div className="landing-page__hero-core-copy">
                <span>Digital Twin</span>
                <strong>ICU Command Node</strong>
              </div>
            </div>

            <div className="landing-page__hero-signal landing-page__hero-signal--top">
              <span>Live telemetry</span>
              <strong>24 streams synced</strong>
            </div>
            <div className="landing-page__hero-signal landing-page__hero-signal--right">
              <span>AI confidence</span>
              <strong>92%</strong>
            </div>
            <div className="landing-page__hero-signal landing-page__hero-signal--bottom">
              <span>Alert routing</span>
              <strong>Active</strong>
            </div>

            <div className="landing-page__hero-grid">
              <div className="landing-page__hero-panel landing-page__hero-panel--accent">
                <span>Risk models</span>
                <strong>3 active</strong>
              </div>
              <div className="landing-page__hero-panel">
                <span>Beds connected</span>
                <strong>{summary[1]?.value || '-'}</strong>
              </div>
              <div className="landing-page__hero-panel">
                <span>Patients tracked</span>
                <strong>{summary[0]?.value || '-'}</strong>
              </div>
              <div className="landing-page__hero-panel landing-page__hero-panel--violet">
                <span>Alerts queue</span>
                <strong>{summary[2]?.value || '-'}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-page__modules" ref={modulesRef}>
        <div className="landing-page__section-head">
          <div>
            <div className="landing-page__section-kicker">System Hub</div>
            <h2>Navigate by capability, not by clutter</h2>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => onNavigate('icu-assistant')}>
            Ask ICU Assistant
          </button>
        </div>

        <div className="landing-page__module-layout">
          <div className="landing-page__module-tabs">
            {modules.map((module) => (
              <button
                key={module.id}
                type="button"
                className={`landing-page__module-tab${module.id === activeModuleId ? ' is-active' : ''}`}
                onClick={() => setActiveModuleId(module.id)}
              >
                <span>{module.meta}</span>
                <strong>{module.label}</strong>
              </button>
            ))}
          </div>

          {activeModule && (
            <div className="landing-page__module-panel">
              <div className="landing-page__module-meta">{activeModule.meta}</div>
              <h3>{activeModule.title}</h3>
              <p>{activeModule.description}</p>
              <div className="landing-page__module-tags">
                {activeModule.tags.map((tag) => (
                  <span key={tag} className="landing-page__module-tag">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="landing-page__module-actions">
                <button type="button" className="btn btn-primary" onClick={() => onNavigate(activeModule.id)}>
                  Open {activeModule.label}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => onNavigate('patient-report')}>
                  Generate report
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="landing-page__group-grid">
        {groups.map((group) => (
          <article key={group.group} className="landing-page__group-card">
            <div className="landing-page__group-kicker">{group.group}</div>
            <div className="landing-page__group-list">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="landing-page__group-link"
                  onClick={() => onNavigate(item.id)}
                >
                  <span className="landing-page__group-link-icon">{item.icon}</span>
                  <span className="landing-page__group-link-copy">
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
