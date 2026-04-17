import React, { useEffect, useMemo, useRef, useState } from 'react';

const normalize = (value) => String(value || '').toLowerCase().trim();

export default function CommandPalette({
  open,
  items = [],
  patients = [],
  onClose,
  onNavigate,
  onSelectPatient,
}) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  const filteredNavigation = useMemo(() => {
    const search = normalize(query);
    if (!search) return items.slice(0, 10);
    return items.filter((item) => normalize(`${item.label} ${item.meta} ${item.description} ${item.searchTerms}`).includes(search)).slice(0, 8);
  }, [items, query]);

  const filteredPatients = useMemo(() => {
    const search = normalize(query);
    if (!search) return patients.slice(0, 5);
    return patients
      .filter((patient) =>
        normalize(`${patient.patient_id} ${patient.name} ${patient.bed_id} ${patient.diagnosis}`).includes(search)
      )
      .slice(0, 5);
  }, [patients, query]);

  if (!open) return null;

  return (
    <div className="command-palette-overlay" onClick={onClose}>
      <div className="command-palette" onClick={(event) => event.stopPropagation()}>
        <div className="command-palette__header">
          <div>
            <div className="command-palette__eyebrow">Command Palette</div>
            <h2>Navigate modules and jump to patients</h2>
          </div>
          <button type="button" className="command-palette__close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="command-palette__search">
          <input
            ref={inputRef}
            type="text"
            className="input-field"
            placeholder="Search pages, alerts, patients, or commands"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="command-palette__body">
          <section className="command-palette__section">
            <div className="command-palette__section-title">Navigation</div>
            <div className="command-palette__results">
              {filteredNavigation.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="command-palette__item"
                  onClick={() => {
                    onNavigate?.(item.id);
                    onClose?.();
                  }}
                >
                  <span className="command-palette__item-icon">{item.icon}</span>
                  <span className="command-palette__item-copy">
                    <strong>{item.label}</strong>
                    <span>{item.description}</span>
                  </span>
                  <span className="command-palette__item-meta">{item.meta}</span>
                </button>
              ))}
              {filteredNavigation.length === 0 && (
                <div className="command-palette__empty">No matching pages found.</div>
              )}
            </div>
          </section>

          <section className="command-palette__section">
            <div className="command-palette__section-title">Patients</div>
            <div className="command-palette__results">
              {filteredPatients.map((patient) => (
                <button
                  key={patient.patient_id}
                  type="button"
                  className="command-palette__item"
                  onClick={() => {
                    onSelectPatient?.(patient.patient_id);
                    onClose?.();
                  }}
                >
                  <span className="command-palette__item-icon">PT</span>
                  <span className="command-palette__item-copy">
                    <strong>{patient.name || patient.patient_id}</strong>
                    <span>
                      {patient.patient_id} · {patient.bed_id || 'Bed TBD'} · {patient.diagnosis || 'Diagnosis pending'}
                    </span>
                  </span>
                  <span className={`badge badge-${patient.status === 'critical' ? 'critical' : 'stable'}`}>
                    {patient.status || 'active'}
                  </span>
                </button>
              ))}
              {filteredPatients.length === 0 && (
                <div className="command-palette__empty">No matching patients found.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
