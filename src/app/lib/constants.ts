// --- Level display ---

export const levelColors: Record<string, string> = {
  debug: '#8E8E93',
  info: '#007AFF',
  warning: '#FF9500',
  error: '#FF3B30',
  critical: '#A02D28',
};

export const levelLabels: Record<string, string> = {
  debug: 'Debug',
  info: 'Info',
  warning: 'Warning',
  error: 'Error',
  critical: 'Critical',
};

// --- Category display ---

export const categoryLabels: Record<string, string> = {
  network: 'Network',
  ui: 'UI Events',
  performance: 'Performance',
  state: 'State Changes',
  background: 'Background Tasks',
};
