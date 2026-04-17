import React from 'react';

export default function PageContainer({ className = '', children }) {
  return <div className={`page-container${className ? ` ${className}` : ''}`}>{children}</div>;
}
