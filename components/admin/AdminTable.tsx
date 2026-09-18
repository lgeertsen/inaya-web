import { ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export interface AdminTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortAccessor?: (row: T) => string | number;
}

export interface AdminTableSortState {
  column: string;
  direction: "asc" | "desc";
}

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage,
  sortState,
  onSortChange,
  minWidth,
}: {
  columns: AdminTableColumn<T>[];
  rows: T[];
  emptyMessage: string;
  sortState?: AdminTableSortState;
  onSortChange?: (column: string) => void;
  /** Minimum table width in px before horizontal scroll kicks in — set this on tables with several columns so cells wrap/scroll instead of clipping on narrow screens. */
  minWidth?: number;
}) {
  if (rows.length === 0) {
    return <p className="p-[14px_18px] text-sm text-ink/60">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]" style={minWidth ? { minWidth } : undefined}>
        <thead>
          <tr className="bg-ink/[0.025]">
            {columns.map((column) => {
              const isSortable = Boolean(column.sortable && onSortChange);
              const isActive = sortState?.column === column.header;
              return (
                <th
                  key={column.header}
                  className="whitespace-nowrap border-b border-ink/10 p-[9px_14px] text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-ink/55"
                >
                  {isSortable ? (
                    <button
                      type="button"
                      onClick={() => onSortChange!(column.header)}
                      className={`flex items-center gap-1 hover:text-ink ${isActive ? "text-ink" : ""}`}
                    >
                      {column.header}
                      {isActive && sortState ? (
                        sortState.direction === "asc" ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )
                      ) : (
                        <ChevronsUpDown size={12} className="opacity-40" />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-ink/7 last:border-0 hover:bg-ink/[0.02]">
              {columns.map((column) => (
                <td key={column.header} className={`whitespace-nowrap p-[8px_14px] ${column.className ?? ""}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
