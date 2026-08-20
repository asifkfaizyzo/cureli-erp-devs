// pharmacy-web/src/pages/report/shared/ReportTable.jsx

const ReportTable = ({
  columns = [],
  rows = [],
  footerRow = null,
  emptyMessage = "No data found",
  stickyHeader = true,
}) => {
  if (!rows.length) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <span className="text-xl">📊</span>
          </div>
          <p className="text-sm text-gray-500 font-medium">{emptyMessage}</p>
          <p className="text-xs text-gray-400 mt-1">
            Try adjusting your filters
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-xs border-collapse">
        <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 font-semibold text-gray-600 whitespace-nowrap
                  ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                  ${col.width ? col.width : ""}
                `}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id || i}
              className="border-b border-gray-100 hover:bg-gray-50/60 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 text-gray-700 whitespace-nowrap
                    ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                  `}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {footerRow && (
          <tfoot className="sticky bottom-0 bg-gray-50 border-t-2 border-gray-300">
            <tr>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-4 py-3 font-bold text-gray-800 whitespace-nowrap
                    ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"}
                  `}
                >
                  {footerRow[col.key] !== undefined
                    ? footerRow[col.key]
                    : col.footerLabel || ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
};

export default ReportTable;