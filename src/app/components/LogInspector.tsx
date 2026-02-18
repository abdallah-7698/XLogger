import type { LogEntry } from '../lib/types';
import { levelColors, levelLabels, categoryLabels } from '../lib/constants';
import { format, parseISO } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';

interface LogInspectorProps {
  log: LogEntry | null;
}

function formatTimestampFull(ts: string): string {
  try {
    const date = parseISO(ts);
    return format(date, 'MMM dd, yyyy HH:mm:ss.SSS');
  } catch {
    return ts;
  }
}

export function LogInspector({ log }: LogInspectorProps) {
  const isNetwork = log?.category === 'network';
  const [prevLogId, setPrevLogId] = useState<string | null>(null);
  const [contextExpanded, setContextExpanded] = useState(!isNetwork);
  const [metadataExpanded, setMetadataExpanded] = useState(true);
  const [requestExpanded, setRequestExpanded] = useState(!isNetwork);
  const [responseExpanded, setResponseExpanded] = useState(true);
  const [performanceExpanded, setPerformanceExpanded] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Reset expanded states when selecting a different log
  if (log && log.id !== prevLogId) {
    setPrevLogId(log.id);
    const net = log.category === 'network';
    setContextExpanded(!net);
    setRequestExpanded(!net);
    setResponseExpanded(true);
    setMetadataExpanded(true);
    setPerformanceExpanded(true);
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast.success('Copied to clipboard');
  };

  if (!log) {
    return (
      <div className="w-full h-full border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col">
        <div className="h-8 flex items-center px-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Details</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">No log selected</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Select a log entry to view details
            </p>
          </div>
        </div>
      </div>
    );
  }

  const InspectorSection = ({
    title,
    isExpanded,
    onToggle,
    children,
  }: {
    title: string;
    isExpanded: boolean;
    onToggle: (value: boolean) => void;
    children: React.ReactNode;
  }) => (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <CollapsibleTrigger className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors w-full border-b border-zinc-200 dark:border-zinc-800">
        {isExpanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        {title}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-4 py-3 space-y-2">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  );

  const InspectorField = ({
    label,
    value,
    monospace = false,
    copyable = true,
  }: {
    label: string;
    value: string | number | undefined;
    monospace?: boolean;
    copyable?: boolean;
  }) => {
    const fieldId = `${label}-${value}`;
    const isCopied = copiedField === fieldId;

    return (
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">{label}</div>
          <div
            className={`text-xs text-zinc-900 dark:text-zinc-100 break-words ${
              monospace ? 'font-mono' : ''
            }`}
          >
            {value ?? 'N/A'}
          </div>
        </div>
        {copyable && value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 flex-shrink-0"
            onClick={() => copyToClipboard(String(value), fieldId)}
          >
            {isCopied ? (
              <Check className="size-3 text-green-600" />
            ) : (
              <Copy className="size-3 text-zinc-400" />
            )}
          </Button>
        )}
      </div>
    );
  };

  const isComplex = (v: unknown): boolean =>
    v !== null && typeof v === 'object' && (Array.isArray(v) ? v.length > 0 : Object.keys(v as object).length > 0);

  const selectBracketGroup = (e: React.MouseEvent) => {
    const bracket = e.currentTarget;
    const group = bracket.closest('[data-bracket-group]');
    if (!group) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(group);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const JsonValue = ({ value, depth = 0 }: { value: unknown; depth?: number }): ReactNode => {
    const indent = '  '.repeat(depth);
    const childIndent = '  '.repeat(depth + 1);

    if (value === null) {
      return <span className="text-orange-600 dark:text-orange-400">null</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-orange-600 dark:text-orange-400">{String(value)}</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-green-600 dark:text-green-400">"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-zinc-500">[]</span>;
      }
      return (
        <span data-bracket-group>
          <span className="text-zinc-500 cursor-pointer" onDoubleClick={selectBracketGroup}>{'['}</span>
          {'\n'}
          {value.map((item, idx) => (
            <span key={idx}>
              {childIndent}
              <JsonValue value={item} depth={depth + 1} />
              {idx < value.length - 1 && <span className="text-zinc-500">,</span>}
              {'\n'}
            </span>
          ))}
          {indent}
          <span className="text-zinc-500 cursor-pointer" onDoubleClick={selectBracketGroup}>{']'}</span>
        </span>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>);
      if (entries.length === 0) {
        return <span className="text-zinc-500">{'{}'}</span>;
      }
      return (
        <span data-bracket-group>
          <span className="text-zinc-500 cursor-pointer" onDoubleClick={selectBracketGroup}>{'{'}</span>
          {'\n'}
          {entries.map(([key, val], idx) => (
            <span key={key}>
              {childIndent}
              <span className="text-purple-600 dark:text-purple-400">"{key}"</span>
              <span className="text-zinc-500">:</span>
              {isComplex(val) ? (
                <>
                  {'\n'}
                  {childIndent}
                  <JsonValue value={val} depth={depth + 1} />
                </>
              ) : (
                <>
                  {' '}
                  <JsonValue value={val} depth={depth + 1} />
                </>
              )}
              {idx < entries.length - 1 && <span className="text-zinc-500">,</span>}
              {'\n'}
            </span>
          ))}
          {indent}
          <span className="text-zinc-500 cursor-pointer" onDoubleClick={selectBracketGroup}>{'}'}</span>
        </span>
      );
    }

    return <span>{String(value)}</span>;
  };

  const JSONDisplay = ({ data, fieldId, fullHeight = false }: { data: unknown; fieldId: string; fullHeight?: boolean }) => {
    const jsonString = JSON.stringify(data, null, 2);
    const isCopied = copiedField === fieldId;

    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-1 right-1 h-6 w-6 p-0 z-10"
          onClick={() => copyToClipboard(jsonString, fieldId)}
        >
          {isCopied ? (
            <Check className="size-3 text-green-600" />
          ) : (
            <Copy className="size-3 text-zinc-400" />
          )}
        </Button>
        <pre className={`text-xs font-mono bg-zinc-100 dark:bg-zinc-800 p-3 rounded overflow-auto whitespace-pre break-words ${fullHeight ? '' : 'max-h-72'}`}>
          <JsonValue value={data} />
        </pre>
      </div>
    );
  };

  return (
    <div className="w-full h-full border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col">
      {/* Header — compact single row */}
      <div className="h-8 flex items-center gap-2 px-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: levelColors[log.level] }}
        />
        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
          {levelLabels[log.level]}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {categoryLabels[log.category]}
        </span>
        <span className="ml-auto text-[10px] font-mono text-zinc-400 dark:text-zinc-500 flex-shrink-0">
          {formatTimestampFull(log.timestamp)}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Message Section — always on top */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Message
          </div>
          <div className="px-4 pb-3">
            {(() => {
              const trimmed = log.message.trim();
              if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                try {
                  const parsed = JSON.parse(trimmed);
                  return (
                    <pre className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 p-3 rounded overflow-auto max-h-72 whitespace-pre break-words">
                      <JsonValue value={parsed} />
                    </pre>
                  );
                } catch {
                  // Not valid JSON, fall through
                }
              }
              return (
                <div className="text-xs text-zinc-900 dark:text-zinc-100 break-words bg-zinc-100 dark:bg-zinc-800 p-3 rounded">
                  {log.message}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Context Section */}
        <InspectorSection title="Context" isExpanded={contextExpanded} onToggle={setContextExpanded}>
          <InspectorField label="File" value={log.file} monospace />
          <InspectorField label="Function" value={log.function} monospace />
          <InspectorField label="Line" value={log.line} monospace />
          <InspectorField label="Thread" value={log.thread} monospace />
          <InspectorField label="Queue" value={log.queueLabel} monospace />
        </InspectorSection>

        {/* Metadata Section */}
        {log.metadata && (
          <InspectorSection
            title="Metadata"
            isExpanded={metadataExpanded}
            onToggle={setMetadataExpanded}
          >
            {Object.entries(log.metadata).map(([key, value]) => {
              if (typeof value === 'object' && value !== null) {
                return (
                  <div key={key}>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{key}</div>
                    <JSONDisplay data={value} fieldId={`meta-${key}`} />
                  </div>
                );
              }
              return (
                <InspectorField
                  key={key}
                  label={key}
                  value={String(value)}
                  monospace={typeof value === 'number'}
                />
              );
            })}
          </InspectorSection>
        )}

        {/* Network Request Section */}
        {log.networkDetails && (
          <InspectorSection
            title="Request"
            isExpanded={requestExpanded}
            onToggle={setRequestExpanded}
          >
            <InspectorField label="URL" value={log.networkDetails.url} monospace />
            <InspectorField label="Method" value={log.networkDetails.method} />
            <InspectorField
              label="Duration"
              value={`${log.networkDetails.duration}ms`}
              monospace
            />

            {log.networkDetails.requestHeaders && (
              <div className="mt-3">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Headers</div>
                <JSONDisplay data={log.networkDetails.requestHeaders} fieldId="req-headers" />
              </div>
            )}

            {log.networkDetails.requestBody && (
              <div className="mt-3">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Body</div>
                <JSONDisplay data={log.networkDetails.requestBody} fieldId="req-body" />
              </div>
            )}
          </InspectorSection>
        )}

        {/* Network Response Section */}
        {log.networkDetails && (
          <InspectorSection
            title="Response"
            isExpanded={responseExpanded}
            onToggle={setResponseExpanded}
          >
            <InspectorField label="Status Code" value={log.networkDetails.statusCode} monospace />
            <InspectorField
              label="Duration"
              value={`${log.networkDetails.duration}ms`}
              monospace
            />

            {log.networkDetails.responseBody && (
              <div className="mt-2">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Body</div>
                <JSONDisplay data={log.networkDetails.responseBody} fieldId="res-body" fullHeight />
              </div>
            )}
          </InspectorSection>
        )}

        {/* Performance Details Section */}
        {log.performanceDetails && (
          <InspectorSection
            title="Performance"
            isExpanded={performanceExpanded}
            onToggle={setPerformanceExpanded}
          >
            <InspectorField
              label="Duration"
              value={`${log.performanceDetails.duration}ms`}
              monospace
            />
            {log.performanceDetails.memoryDelta !== undefined && (
              <InspectorField
                label="Memory Delta"
                value={`${log.performanceDetails.memoryDelta > 0 ? '+' : ''}${(
                  log.performanceDetails.memoryDelta / 1024
                ).toFixed(2)} KB`}
                monospace
              />
            )}
          </InspectorSection>
        )}
      </div>
    </div>
  );
}
