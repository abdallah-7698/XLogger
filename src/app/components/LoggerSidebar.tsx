import { Bug, Info, AlertTriangle, XCircle, AlertOctagon, Network, Layout, Gauge, Database, Clock, List } from 'lucide-react';
import type { LogLevel, LogCategory } from '../lib/types';
import { levelLabels, categoryLabels } from '../lib/constants';
import { Badge } from './ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface LoggerSidebarProps {
  selectedLevel: LogLevel | 'all';
  onSelectLevel: (level: LogLevel | 'all') => void;
  selectedCategory: LogCategory | 'all';
  onSelectCategory: (category: LogCategory | 'all') => void;
  levelCounts: Record<LogLevel, number>;
  categoryCounts: Record<LogCategory, number>;
  levelAllCount: number;
  categoryAllCount: number;
}

const levelIcons = {
  debug: Bug,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
  critical: AlertOctagon,
};

const categoryIcons = {
  network: Network,
  ui: Layout,
  performance: Gauge,
  state: Database,
  background: Clock,
};

export function LoggerSidebar({
  selectedLevel,
  onSelectLevel,
  selectedCategory,
  onSelectCategory,
  levelCounts,
  categoryCounts,
  levelAllCount,
  categoryAllCount,
}: LoggerSidebarProps) {
  const [levelsExpanded, setLevelsExpanded] = useState(true);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);

  const renderSidebarItem = (
    id: string,
    label: string,
    Icon: any,
    count: number,
    isSelected: boolean,
    onClick: () => void
  ) => (
    <button
      key={id}
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm rounded transition-colors ${
        isSelected
          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
      }`}
    >
      <Icon className="size-4 flex-shrink-0" />
      <span className="flex-1 text-left">{label}</span>
      <Badge variant="secondary" className="h-5 min-w-[28px] px-1.5 text-xs font-mono justify-center">
        {count.toLocaleString()}
      </Badge>
    </button>
  );

  return (
    <div className="w-full h-full border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex flex-col">
        <div className="h-8 flex items-center px-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0">
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Filters</span>
        </div>
        <div className="p-2 space-y-4 overflow-y-auto flex-1">
          {/* Categories Section */}
          <Collapsible open={categoriesExpanded} onOpenChange={setCategoriesExpanded}>
            <CollapsibleTrigger className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors w-full">
              {categoriesExpanded ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              Log Categories
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-1">
              {renderSidebarItem(
                'all-categories',
                'All Categories',
                List,
                categoryAllCount,
                selectedCategory === 'all',
                () => onSelectCategory('all')
              )}
              {(Object.keys(categoryIcons) as LogCategory[]).map((category) =>
                renderSidebarItem(
                  category,
                  categoryLabels[category],
                  categoryIcons[category],
                  categoryCounts[category],
                  selectedCategory === category,
                  () => onSelectCategory(category)
                )
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Log Levels Section */}
          <Collapsible open={levelsExpanded} onOpenChange={setLevelsExpanded}>
            <CollapsibleTrigger className="flex items-center gap-1 px-2 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors w-full">
              {levelsExpanded ? (
                <ChevronDown className="size-3" />
              ) : (
                <ChevronRight className="size-3" />
              )}
              Severity Levels
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5 mt-1">
              {renderSidebarItem(
                'all-levels',
                'All Levels',
                List,
                levelAllCount,
                selectedLevel === 'all',
                () => onSelectLevel('all')
              )}
              {(Object.keys(levelIcons) as LogLevel[]).map((level) =>
                renderSidebarItem(
                  level,
                  levelLabels[level],
                  levelIcons[level],
                  levelCounts[level],
                  selectedLevel === level,
                  () => onSelectLevel(level)
                )
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
    </div>
  );
}
