/**
 * Responsive Table Component
 * Switches to card layout on mobile devices
 */

import { ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  mobileLabel?: string;
  className?: string;
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  mobileCardRender?: (row: T) => ReactNode;
  onRowClick?: (row: T) => void;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  mobileCardRender,
  onRowClick,
}: ResponsiveTableProps<T>) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const getCellValue = (row: T, column: Column<T>) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row);
    }
    return row[column.accessor] as ReactNode;
  };

  // Mobile card view
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((row) => (
          <Card
            key={keyExtractor(row)}
            className={onRowClick ? 'cursor-pointer hover:bg-accent transition-colors' : ''}
            onClick={() => onRowClick?.(row)}
          >
            <CardContent className="p-4">
              {mobileCardRender ? (
                mobileCardRender(row)
              ) : (
                <div className="space-y-2">
                  {columns.map((column, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">
                        {column.mobileLabel || column.header}:
                      </span>
                      <span className="text-sm text-right ml-2">
                        {getCellValue(row, column)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column, idx) => (
              <TableHead key={idx} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow
              key={keyExtractor(row)}
              className={onRowClick ? 'cursor-pointer' : ''}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column, idx) => (
                <TableCell key={idx} className={column.className}>
                  {getCellValue(row, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
