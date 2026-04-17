import React, { useEffect, useMemo, useState } from 'react';

const SPLINE_SCRIPT_ID = 'spline-viewer-runtime';
const SPLINE_SCRIPT_SRC = 'https://unpkg.com/@splinetool/viewer@1.12.74/build/spline-viewer.js';

const loadSplineScript = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Spline viewer is only available in the browser.'));
      return;
    }

    const existing = document.getElementById(SPLINE_SCRIPT_ID);
    if (existing) {
      if (customElements.get('spline-viewer')) {
        resolve(true);
        return;
      }

      existing.addEventListener('load', () => resolve(true), { once: true });
      existing.addEventListener('error', () => reject(new Error('Unable to load Spline viewer.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SPLINE_SCRIPT_ID;
    script.type = 'module';
    script.src = SPLINE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error('Unable to load Spline viewer.'));
    document.head.appendChild(script);
  });

export default function SplineScene({
  url,
  wrapperClassName = '',
  hostClassName = '',
  viewerClassName = '',
  loadingClassName = '',
  fallbackClassName = '',
  loadingLabel = 'Loading 3D scene',
  fallbackContent = null,
}) {
  const [status, setStatus] = useState(url ? 'loading' : 'idle');

  useEffect(() => {
    let active = true;

    if (!url) {
      setStatus('idle');
      return undefined;
    }

    setStatus('loading');

    loadSplineScript()
      .then(() => {
        if (active) setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [url]);

  const viewerElement = useMemo(() => {
    if (!url || status !== 'ready') return null;
    return React.createElement('spline-viewer', {
      url,
      loading: 'lazy',
      class: viewerClassName || undefined,
    });
  }, [status, url, viewerClassName]);

  return (
    <div className={wrapperClassName}>
      <div className={hostClassName}>
        {status === 'ready' && viewerElement}
        {status === 'loading' && (
          <div className={loadingClassName}>
            <span>{loadingLabel}</span>
          </div>
        )}
        {status === 'error' && <div className={fallbackClassName}>{fallbackContent || <span>3D unavailable</span>}</div>}
      </div>
    </div>
  );
}
