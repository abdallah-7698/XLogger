export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type LogCategory = 'network' | 'ui' | 'performance' | 'state' | 'background';

export interface NetworkDetails {
  url: string;
  method: string;
  statusCode: number;
  duration: number;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
}

export interface PerformanceDetails {
  startTime: number;
  endTime: number;
  duration: number;
  memoryDelta?: number;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  thread: string;
  file?: string;
  function?: string;
  line?: number;
  queueLabel?: string;
  metadata?: Record<string, any>;
  networkDetails?: NetworkDetails;
  performanceDetails?: PerformanceDetails;
}
