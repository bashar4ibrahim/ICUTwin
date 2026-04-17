import React from 'react';

export default function PageSection({ className = '', children }) {
  return <section className={`page-section${className ? ` ${className}` : ''}`}>{children}</section>;
}
