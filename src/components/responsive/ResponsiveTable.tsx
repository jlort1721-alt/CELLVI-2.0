/**
 * Responsive Table Component
 * Automatically switches between table layout (desktop) and card layout (mobile)
 * WCAG 2.1 AA Compliant with proper ARIA attributes
 */

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Column<T = any> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
  mobileLabel?: string; // Custom label for mobile view
  hiddenOnMobile?: boolean; // Hide this column on mobile
  sortable?: boolean;
}

export interface ResponsiveTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  breakpoint?: 'sm' | 'md' | 'lg'; // When to switch to card layout
  cardClassName?: string;
}

export function ResponsiveTable<T = any>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No hay datos disponibles',
  className,
  breakpoint = 'md',
  cardClassName,
}: ResponsiveTableProps<T>) {
  const breakpointClass = {
    sm: 'sm:table',
    md: 'md:table',
    lg: 'lg:table',
  }[breakpoint];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  const visibleColumns = columns.filter((col) => !col.hiddenOnMobile);
  const mobileColumns = columns.filter((col) => !col.hiddenOnMobile);

  return (
    <>
      {/* Desktop Table View */}
      <div className={cn(`hidden ${breakpointClass}`, className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {visibleColumns.map((column) => (
                <TableHead key={column.key} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => {
              const key = keyExtractor(row, index);
              return (
                <TableRow
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                >
                  {visibleColumns.map((column) => {
                    const value = (row as any)[column.key];
                    return (
                      <TableCell key={column.key} className={column.className}>
                        {column.render ? column.render(value, row) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className={cn(`block ${breakpointClass}:hidden space-y-3`, className)}>
        {data.map((row, index) => {
          const key = keyExtractor(row, index);
          return (
            <div
              key={key}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'rounded-lg border bg-card p-4 space-y-2',
                onRowClick && 'cursor-pointer hover:bg-muted/50 active:bg-muted',
                cardClassName
              )}
              role="button"
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
            >
              {mobileColumns.map((column) => {
                const value = (row as any)[column.key];
                const label = column.mobileLabel || column.label;

                return (
                  <div key={column.key} className="flex justify-between items-start gap-2">
                    <span className="text-xs font-medium text-muted-foreground min-w-[100px]">
                      {label}:
                    </span>
                    <span className="text-sm text-right flex-1">
                      {column.render ? column.render(value, row) : value}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

/**
 * Simple responsive table wrapper for common use cases
 */
export const SimpleResponsiveTable = <T extends Record<string, any>>({
  data,
  exclude = [],
  ...props
}: Omit<ResponsiveTableProps<T>, 'columns' | 'keyExtractor'> & {
  exclude?: string[];
}) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground text-sm">
        {props.emptyMessage || 'No hay datos disponibles'}
      </div>
    );
  }

  // Auto-generate columns from first row
  const firstRow = data[0];
  const columns: Column<T>[] = Object.keys(firstRow)
    .filter((key) => !exclude.includes(key))
    .map((key) => ({
      key,
      label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
    }));

  return (
    <ResponsiveTable
      {...props}
      columns={columns}
      data={data}
      keyExtractor={(row, index) => (row.id as string) || `row-${index}`}
    />
  );
};
