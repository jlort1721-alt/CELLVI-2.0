import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export interface VirtualColumn<T> {
  key: keyof T;
  header: string;
  width?: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: VirtualColumn<T>[];
  rowHeight?: number;
  className?: string;
  maxHeight?: string;
}

export function VirtualizedTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 40,
  className = "",
  maxHeight = "500px",
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 20,
  });

  return (
    <div
      ref={parentRef}
      className={`overflow-auto rounded-lg border border-sidebar-border ${className}`}
      style={{ maxHeight }}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex bg-sidebar border-b border-sidebar-border">
        {columns.map((col) => (
          <div
            key={String(col.key)}
            className="px-3 py-2 text-[10px] font-bold text-sidebar-foreground/50 uppercase tracking-wider"
            style={{ width: col.width || "auto", flex: col.width ? "none" : 1 }}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Virtualized body */}
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const row = data[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              className="absolute left-0 w-full flex items-center border-b border-sidebar-border/50 text-xs text-sidebar-foreground/70 hover:bg-sidebar-accent/30"
              style={{
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {columns.map((col) => (
                <div
                  key={String(col.key)}
                  className="px-3 truncate"
                  style={{ width: col.width || "auto", flex: col.width ? "none" : 1 }}
                >
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8 text-xs text-sidebar-foreground/40">
          Sin datos disponibles
        </div>
      )}
    </div>
  );
}
