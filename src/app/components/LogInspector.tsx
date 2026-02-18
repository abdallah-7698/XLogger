import type { LogEntry } from '../lib/types';
import { levelColors, levelLabels, categoryLabels } from '../lib/constants';
import { format, parseISO } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';

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
  const [contextExpanded, setContextExpanded] = useState(true);
  const [metadataExpanded, setMetadataExpanded] = useState(true);
  const [networkExpanded, setNetworkExpanded] = useState(true);
  const [performanceExpanded, setPerformanceExpanded] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!log) {
    return (
      <div className="w-80 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No log selected</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
            Select a log entry to view details
          </p>
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

  const JSONDisplay = ({ data, fieldId }: { data: any; fieldId: string }) => {
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
        <pre className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 p-3 rounded overflow-x-auto max-h-48">
          {jsonString}
        </pre>
      </div>
    );
  };

  return (
    <div className="w-80 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: levelColors[log.level] }}
          />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {levelLabels[log.level]}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {categoryLabels[log.category]}
          </span>
        </div>
        <div className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
          {formatTimestampFull(log.timestamp)}
        </div>
      </div>

      <ScrollArea className="flex-1">
        {/* Context Section */}
        <InspectorSection title="Context" isExpanded={contextExpanded} onToggle={setContextExpanded}>
          <InspectorField label="File" value={log.file} monospace />
          <InspectorField label="Function" value={log.function} monospace />
          <InspectorField label="Line" value={log.line} monospace />
          <InspectorField label="Thread" value={log.thread} monospace />
          <InspectorField label="Queue" value={log.queueLabel} monospace />
        </InspectorSection>

        {/* Message Section */}
        <div className="border-b border-zinc-200 dark:border-zinc-800">
          <div className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
            Message
          </div>
          <div className="px-4 pb-3">
            <div className="text-xs text-zinc-900 dark:text-zinc-100 break-words bg-zinc-100 dark:bg-zinc-800 p-3 rounded">
              {log.message}
            </div>
          </div>
        </div>

        {/* Metadata Section */}
        {log.metadata && (
          <InspectorSection
            title="Metadata"
            isExpanded={metadataExpanded}
            onToggle={setMetadataExpanded}
          >
            {Object.entries(log.metadata).map(([key, value]) => (
              <InspectorField
                key={key}
                label={key}
                value={String(value)}
                monospace={typeof value === 'number'}
              />
            ))}
          </InspectorSection>
        )}

        {/* Network Details Section */}
        {log.networkDetails && (
          <InspectorSection
            title="Network Details"
            isExpanded={networkExpanded}
            onToggle={setNetworkExpanded}
          >
            <InspectorField label="URL" value={log.networkDetails.url} monospace />
            <InspectorField label="Method" value={log.networkDetails.method} />
            <InspectorField label="Status Code" value={log.networkDetails.statusCode} monospace />
            <InspectorField
              label="Duration"
              value={`${log.networkDetails.duration}ms`}
              monospace
            />

            {log.networkDetails.requestHeaders && (
              <div className="mt-3">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Request Headers</div>
                <JSONDisplay data={log.networkDetails.requestHeaders} fieldId="req-headers" />
              </div>
            )}

            {log.networkDetails.requestBody && (
              <div className="mt-3">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Request Body</div>
                <JSONDisplay data={log.networkDetails.requestBody} fieldId="req-body" />
              </div>
            )}

            {log.networkDetails.responseBody && (
              <div className="mt-3">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Response Body</div>
                <JSONDisplay data={log.networkDetails.responseBody} fieldId="res-body" />
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
      </ScrollArea>
    </div>
  );
}
