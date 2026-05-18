export const DataTable = ({ columns, rows, empty = 'Нет данных' }) => (
  <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-border/70 bg-secondary/50 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="px-4 py-3">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.length ? rows.map((row) => (
            <tr key={row.id} className="hover:bg-secondary/35">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 align-top">
                  {column.render ? column.render(row) : row[column.key]}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);
