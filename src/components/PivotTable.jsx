import React from "react";
import "../styles/PivotTable.css";

const calculate = (values, aggregation) => {
  const nums = values.map(Number).filter((v) => !isNaN(v));
  if (!nums.length) return "";

  switch (aggregation) {
    case "SUM":
      return nums.reduce((a, b) => a + b, 0).toFixed(2);
    case "AVERAGE":
      return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
    case "MIN":
      return Math.min(...nums).toFixed(2);
    case "MAX":
      return Math.max(...nums).toFixed(2);
    case "COUNT":
      return nums.length;
    case "MEDIAN": {
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? ((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2)
        : sorted[mid].toFixed(2);
    }
    default:
      return "";
  }
};

const getKey = (obj, fields) => fields.map((f) => obj[f]).join(" | ");

const PivotTable = ({ data, rowFields, columnFields, measures }) => {
  const pivot = {};

  data.forEach((row) => {
    const rowKey = getKey(row, rowFields);
    const colKey = getKey(row, columnFields);
    if (!pivot[rowKey]) pivot[rowKey] = {};
    if (!pivot[rowKey][colKey]) pivot[rowKey][colKey] = {};

    measures.forEach(({ field }) => {
      if (!pivot[rowKey][colKey][field]) pivot[rowKey][colKey][field] = [];
      pivot[rowKey][colKey][field].push(Number(row[field]));
    });
  });

  const rowKeys = Object.keys(pivot).sort();
  const colKeys = new Set();
  rowKeys.forEach((rk) =>
    Object.keys(pivot[rk]).forEach((ck) => colKeys.add(ck))
  );
  const sortedColKeys = [...colKeys].sort();

  const columnTotals = {};
  sortedColKeys.forEach((col) => {
    measures.forEach(({ field, aggregation }) => {
      const values = rowKeys.flatMap((row) => pivot[row]?.[col]?.[field] || []);
      columnTotals[`${col}-${field}-${aggregation}`] = calculate(
        values,
        aggregation
      );
    });
  });

  const grandTotal = Object.values(columnTotals)
    .reduce((acc, val) => acc + parseFloat(val || 0), 0)
    .toFixed(2);

  return (
    <div className="pivot-table-container">
      <table
        className="pivot-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <thead>
          <tr className="pivot-header">
            <th className="pivot-header-cell" rowSpan={2}>
              {rowFields.join(" / ")}
            </th>
            {sortedColKeys.map((col) => (
              <th
                key={col}
                colSpan={measures.length}
                className="pivot-header-cell"
              >
                {col}
              </th>
            ))}
            <th className="pivot-header-cell" rowSpan={2}>
              Row Total
            </th>
          </tr>
          <tr className="pivot-subheader">
            {sortedColKeys.map((col) =>
              measures.map((m) => (
                <th
                  key={`${col}-${m.field}-${m.aggregation}`}
                  className="pivot-subheader-cell"
                >
                  {m.field} ({m.aggregation})
                </th>
              ))
            )}
          </tr>
        </thead>

        <tbody>
          {rowKeys.map((row) => {
            const rowTotal = measures
              .reduce((acc, m) => {
                const values = sortedColKeys.flatMap(
                  (col) => pivot[row]?.[col]?.[m.field] || []
                );
                return acc + parseFloat(calculate(values, m.aggregation) || 0);
              }, 0)
              .toFixed(2);

            return (
              <tr key={row} className="pivot-row">
                <td className="pivot-row-label">{row}</td>
                {sortedColKeys.map((col) =>
                  measures.map((m) => {
                    const values = pivot[row]?.[col]?.[m.field] || [];
                    return (
                      <td
                        key={`${row}-${col}-${m.field}-${m.aggregation}`}
                        className="pivot-data-cell"
                      >
                        {calculate(values, m.aggregation)}
                      </td>
                    );
                  })
                )}
                <td className="pivot-row-total">{rowTotal}</td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr className="pivot-footer">
            <td className="pivot-footer-label">Column Totals</td>
            {sortedColKeys.map((col) =>
              measures.map((m) => (
                <td
                  key={`${col}-${m.field}-${m.aggregation}`}
                  className="pivot-footer-cell"
                >
                  {columnTotals[`${col}-${m.field}-${m.aggregation}`]}
                </td>
              ))
            )}
            <td className="pivot-footer-total">{grandTotal}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default React.memo(PivotTable);
