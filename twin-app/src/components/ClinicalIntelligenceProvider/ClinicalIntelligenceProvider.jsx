import React, { createContext, useContext } from 'react';
import './ClinicalIntelligenceProvider.css';
const ClinicalIntelligenceContext = createContext(null);
const useClinicalIntelligence = () => {
  const context = useContext(ClinicalIntelligenceContext);
  if (!context) throw new Error('Clinical intelligence context is not available.');
  return context;
};
const ClinicalIntelligenceProvider = ({ children, value }) => (
  <ClinicalIntelligenceContext.Provider value={value}>
    {children}
  </ClinicalIntelligenceContext.Provider>
);

export { ClinicalIntelligenceContext, useClinicalIntelligence };
export default ClinicalIntelligenceProvider;
