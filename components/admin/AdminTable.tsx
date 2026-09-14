import { ReactNode } from "react";

export interface AdminTableColumn<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  emptyMessage,
}: {
  columns: AdminTableColumn<T>[];
  rows: T[];
  emptyMessage: string;
}) {
  if (rows.length === 0) {
    return <p className="opacity-60 text-sm">{emptyMessage}</p>;
  }

  return (
    <div className="bg-surface rounded-card overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/10">
            {columns.map((column) => (
              <th
                key={column.header}
                className="p-4 text-left text-[11.5px] uppercase tracking-[0.12em] text-ink/50 font-bold whitespace-nowrap"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-ink/10 last:border-0">
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
