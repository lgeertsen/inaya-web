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
}: {
  columns: AdminTableColumn<T>[];
  rows: T[];
  emptyMessage: string;
  sortState?: AdminTableSortState;
  onSortChange?: (column: string) => void;
}) {
  if (rows.length === 0) {
    return <p className="opacity-60 text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="bg-surface rounded-card overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/10">
            {columns.map((column) => {
              const isSortable = Boolean(column.sortable && onSortChange);
              const isActive = sortState?.column === column.header;
              return (
                <th
                  key={column.header}
                  className="p-4 text-left text-[11.5px] uppercase tracking-[0.12em] text-ink/50 font-bold whitespace-nowrap"
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
                          <ChevronUp size={13} />
                        ) : (
                          <ChevronDown size={13} />
                        )
                      ) : (
                        <ChevronsUpDown size={13} className="opacity-40" />
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
            <tr key={row.id} className="border-b border-ink/10 last:border-0 hover:bg-ink/[0.02]">
              {columns.map((column) => (
                <td key={column.header} className={`p-4 whitespace-nowrap ${column.className ?? ""}`}>
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
