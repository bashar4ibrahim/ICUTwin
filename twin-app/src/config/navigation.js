export const NAVIGATION_GROUP_ORDER = ['Overview', 'Clinical', 'AI', 'Operations', 'System'];

export const NAVIGATION_ITEMS = [
  {
    id: 'home',
    label: 'Home',
    shortLabel: 'Home',
    icon: 'HM',
    group: 'Overview',
    targetPage: 'home',
    description: 'Premium landing hub for the ICU Digital Twin platform.',
    searchTerms: ['landing', 'hub', 'overview'],
  },
  {
    id: 'command-center',
    label: 'Command Center',
    shortLabel: 'Command',
    icon: 'CC',
    group: 'Overview',
    targetPage: 'dashboard',
    viewMode: 'command',
    description: 'Operational overview for occupancy, critical events, and live monitoring.',
    searchTerms: ['dashboard', 'overview', 'operations'],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    shortLabel: 'Analytics',
    icon: 'AN',
    group: 'Overview',
    targetPage: 'dashboard',
    viewMode: 'analytics',
    description: 'Executive analytics for patient risk, occupancy, trends, and throughput.',
    searchTerms: ['trends', 'executive', 'metrics'],
  },
  {
    id: 'patients',
    label: 'Patients',
    shortLabel: 'Patients',
    icon: 'PT',
    group: 'Clinical',
    targetPage: 'patients',
    viewMode: 'patients',
    description: 'Admission, monitoring status, and AI-supported patient management.',
    searchTerms: ['registry', 'patient list', 'icu patients'],
  },
  {
    id: 'digital-twin',
    label: 'Digital Twin',
    shortLabel: 'Twin',
    icon: 'DT',
    group: 'Clinical',
    targetPage: 'vitals',
    viewMode: 'digitalTwin',
    description: 'Patient digital twin workspace blending live vitals, AI, and trajectory data.',
    searchTerms: ['monitor', 'workspace', 'patient twin'],
  },
  {
    id: 'vitals-monitor',
    label: 'Vitals Monitor',
    shortLabel: 'Vitals',
    icon: 'VM',
    group: 'Clinical',
    targetPage: 'vitals',
    viewMode: 'monitor',
    description: 'Streaming physiological monitoring with websocket-backed live telemetry.',
    searchTerms: ['telemetry', 'stream', 'signals'],
  },
  {
    id: 'patient-timeline',
    label: 'Patient Timeline',
    shortLabel: 'Timeline',
    icon: 'TL',
    group: 'Clinical',
    targetPage: 'vitals',
    viewMode: 'timeline',
    description: 'Chronological view of vitals, predictions, and patient condition shifts.',
    searchTerms: ['history', 'timeline', 'trajectory'],
  },
  {
    id: 'patient-report',
    label: 'Patient Report',
    shortLabel: 'Report',
    icon: 'RP',
    group: 'Clinical',
    targetPage: 'report',
    description: 'Generate, preview, print, and export a professional patient document.',
    searchTerms: ['summary', 'document', 'pdf'],
  },
  {
    id: 'ai-risk-engine',
    label: 'AI Risk Engine',
    shortLabel: 'Risk',
    icon: 'AI',
    group: 'AI',
    targetPage: 'ai',
    initialTab: 'scores',
    description: 'Shared AI risk predictions, LOS signals, and local custom model orchestration.',
    searchTerms: ['risk', 'prediction', 'model'],
  },
  {
    id: 'icu-assistant',
    label: 'ICU Assistant',
    shortLabel: 'Assistant',
    icon: 'AS',
    group: 'AI',
    targetPage: 'chatbot',
    description: 'Conversational assistant for patient questions, reports, and clinical navigation.',
    searchTerms: ['chat', 'assistant', 'questions'],
  },
  {
    id: 'alerts-center',
    label: 'Alerts Center',
    shortLabel: 'Alerts',
    icon: 'AL',
    group: 'AI',
    targetPage: 'ai',
    initialTab: 'alerts',
    description: 'Unified clinical alert queue for AI signals, escalations, and audit history.',
    searchTerms: ['alerts', 'escalations', 'queue'],
  },
  {
    id: 'scenario-simulator',
    label: 'Scenario Simulator',
    shortLabel: 'Simulator',
    icon: 'SC',
    group: 'AI',
    targetPage: 'resources',
    viewMode: 'simulation',
    initialType: 'All',
    description: 'Run capacity what-if simulations for surges, staffing, and equipment stress.',
    searchTerms: ['simulation', 'capacity', 'what-if'],
  },
  {
    id: 'beds',
    label: 'Beds',
    shortLabel: 'Beds',
    icon: 'BD',
    group: 'Operations',
    targetPage: 'resources',
    viewMode: 'beds',
    initialType: 'bed',
    description: 'Focused bed board with occupancy, assignments, and live resource state.',
    searchTerms: ['occupancy', 'board', 'icu beds'],
  },
  {
    id: 'care-team',
    label: 'Care Team',
    shortLabel: 'Care Team',
    icon: 'CT',
    group: 'Operations',
    targetPage: 'patients',
    viewMode: 'careTeam',
    description: 'Patient roster re-framed around attending team, department, and care coordination.',
    searchTerms: ['team', 'nursing', 'department'],
  },
  {
    id: 'settings',
    label: 'Settings',
    shortLabel: 'Settings',
    icon: 'ST',
    group: 'System',
    drawer: 'settings',
    description: 'Theme, density, and shell preferences for the workspace.',
    searchTerms: ['preferences', 'theme', 'appearance'],
  },
  {
    id: 'help',
    label: 'Help',
    shortLabel: 'Help',
    icon: 'HP',
    group: 'System',
    drawer: 'help',
    description: 'Quick guidance for navigation, AI workflows, and live integrations.',
    searchTerms: ['support', 'guide', 'docs'],
  },
];

export const DEFAULT_NAV_ID = 'home';

export const DEFAULT_TARGET_NAV = {
  home: 'home',
  dashboard: 'command-center',
  patients: 'patients',
  vitals: 'digital-twin',
  resources: 'scenario-simulator',
  report: 'patient-report',
  ai: 'ai-risk-engine',
  chatbot: 'icu-assistant',
};

export const HOME_MODULES = [
  {
    id: 'command-center',
    label: 'Command Center',
    title: 'Live ICU command surface',
    meta: 'Overview',
    description: 'Monitor occupancy, live critical signals, and operational status through one executive-ready overview.',
    tags: ['Live telemetry', 'Beds & vents', 'AI alerts'],
  },
  {
    id: 'digital-twin',
    label: 'Digital Twin',
    title: 'Patient-centric digital twin workspace',
    meta: 'Clinical',
    description: 'Navigate from live physiology to AI interpretation and patient trajectory without leaving the workspace.',
    tags: ['Vitals stream', 'Clinical intelligence', 'Patient context'],
  },
  {
    id: 'patient-report',
    label: 'Patient Report',
    title: 'Clinical document generation',
    meta: 'Clinical',
    description: 'Produce a professional patient document ready for screen review, printing, or PDF export.',
    tags: ['Exportable', 'Print-ready', 'Assistant-triggered'],
  },
  {
    id: 'ai-risk-engine',
    label: 'AI Risk Engine',
    title: 'Unified prediction and alerting layer',
    meta: 'AI',
    description: 'Combine backend risk endpoints with the local custom model to surface scoring, alerts, and recommendations.',
    tags: ['Risk scoring', 'LOS predictions', 'Custom model'],
  },
  {
    id: 'scenario-simulator',
    label: 'Scenario Simulator',
    title: 'Operational scenario modeling',
    meta: 'AI + Ops',
    description: 'Stress-test the ICU using surge scenarios and projected resource capacity from the existing API layer.',
    tags: ['What-if capacity', 'Beds', 'Staff & equipment'],
  },
  {
    id: 'icu-assistant',
    label: 'ICU Assistant',
    title: 'Conversational navigation and reporting',
    meta: 'AI',
    description: 'Ask for patient summaries, explain risk changes, and trigger report generation through natural language.',
    tags: ['Chat', 'Patient summaries', 'Guided actions'],
  },
];

export const getNavigationItem = (id) => NAVIGATION_ITEMS.find((item) => item.id === id) || null;

export const getNavigationByGroup = () =>
  NAVIGATION_GROUP_ORDER.map((group) => ({
    group,
    items: NAVIGATION_ITEMS.filter((item) => item.group === group),
  }));

export const findNavigationForTarget = (targetPage, options = {}) => {
  const { viewMode, initialTab } = options;
  const directMatch = NAVIGATION_ITEMS.find((item) => {
    if (item.targetPage !== targetPage) return false;
    if (viewMode && item.viewMode !== viewMode) return false;
    if (initialTab && item.initialTab !== initialTab) return false;
    return true;
  });
  if (directMatch) return directMatch;
  return getNavigationItem(DEFAULT_TARGET_NAV[targetPage] || DEFAULT_NAV_ID);
};

export const buildPaletteItems = () =>
  NAVIGATION_ITEMS.map((item) => ({
    id: item.id,
    type: 'navigation',
    label: item.label,
    meta: item.group,
    description: item.description,
    icon: item.icon,
    searchTerms: [item.label, item.group, item.targetPage, item.viewMode, item.initialTab, ...(item.searchTerms || [])]
      .filter(Boolean)
      .join(' '),
  }));
