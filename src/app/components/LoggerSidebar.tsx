import { Network, Layout, Gauge, Database, Clock, List } from 'lucide-react';

import { Badge } from './ui/badge';

import { categoryLabels } from '../lib/constants';

import type { LogCategory } from '../lib/types';

interface LoggerSidebarProps {
  selectedCategory: LogCategory | 'all';
  onSelectCategory: (category: LogCategory | 'all') => void;
  categoryCounts: Record<LogCategory, number>;
  categoryAllCount: number;
}

const categoryIcons = {
  network: Network,
  ui: Layout,
  performance: Gauge,
  state: Database,
  background: Clock,
};

export function LoggerSidebar({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  categoryAllCount,
}: LoggerSidebarProps) {

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
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Categories</span>
        </div>
        <div className="p-2 space-y-0.5 overflow-y-auto flex-1">
          {renderSidebarItem(
            'all-categories',
            'All',
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
        </div>
    </div>
  );
}
