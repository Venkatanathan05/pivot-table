import React, { useMemo } from "react";
import "../styles/PivotTable.css";

const formatHeader = (str) =>
  str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const getKeyStr = (arr) => arr.map((k) => k ?? "Total").join("|");

const getUniqueKeys = (data, fields) => {
  const map = new Map();
  data.forEach((row) => {
    const key = fields.map((f) => row[f] ?? "Total");
    const keyStr = getKeyStr(key);
    map.set(keyStr, key);
  });
  const keys = Array.from(map.values()).sort((a, b) =>
    a.join("|").localeCompare(b.join("|"))
  );
  console.log(
    `Unique Keys for ${fields.join(", ")}:`,
    JSON.stringify(keys, null, 2)
  );
  return keys;
};

const preprocessDateFields = (data, fields) => {
  const processed = data.map((row) => {
    const newRow = { ...row };
    fields.forEach((field) => {
      const val = row[field];
      const date = new Date(val);
      if (val && !isNaN(date)) {
        newRow[`${field}_Year`] = date.getFullYear();
        newRow[`${field}_Month`] = date.getMonth() + 1;
        newRow[`${field}_Day`] = date.getDate();
      }
    });
    return newRow;
  });
  console.log("Processed Data:", JSON.stringify(processed, null, 2));
  return processed;
};

const cleanNumericValue = (value) => {
  if (typeof value === "string") {
    const cleanedValue = value.replace(/[^0-9.-]+/g, "");
    return parseFloat(cleanedValue);
  }
  return parseFloat(value);
};

const groupByLevel = (keys, level) =>
  keys.reduce((res, key) => {
    const val = key[level] ?? "Total";
    (res[val] = res[val] || []).push(key);
    return res;
  }, {});

const countLeafCols = (group, level, colFields) =>
  level >= colFields.length
    ? 1
    : Object.values(groupByLevel(group, level)).reduce(
        (sum, g) => sum + countLeafCols(g, level + 1, colFields),
        0
      );

const countLeafRows = (group, level, rowFields) =>
  level >= rowFields.length
    ? group.length
    : Object.values(groupByLevel(group, level)).reduce(
        (sum, g) => sum + countLeafRows(g, level + 1, rowFields),
        0
      );

const formatNumber = (num) =>
  num == null ? "" : Number.isInteger(num) ? num : num.toFixed(2);

const usePivotData = (rawData, rowFields, colFields, measures) => {
  return useMemo(() => {
    if (!rawData.length) {
      return {
        pivot: {},
        rowKeys: [],
        colKeys: [],
        valFields: [],
        aggregateFuncs: {},
        rowTotals: {},
        colTotals: {},
        grandTotals: {},
      };
    }

    const valFields = measures.map((m) => m.field);
    const aggregateFuncs = measures.reduce(
      (acc, m) => ({
        ...acc,
        [m.field]: m.aggregation.toLowerCase().replace("average", "avg"),
      }),
      {}
    );

    const hasSeparatorIssue = rawData.some((row) =>
      Object.values(row).some(
        (val) => typeof val === "string" && val.includes("/")
      )
    );
    if (hasSeparatorIssue) {
      console.warn(
        "Data contains '/' in values, which may affect hierarchy rendering."
      );
    }

    const allFields = [...rowFields, ...colFields];
    const dateFields = [
      ...new Set(allFields.map((f) => f.split("_")[0])),
    ].filter((base) => rawData[0]?.[base] && !rawData[0]?.[`${base}_Year`]);

    const processedData = preprocessDateFields(rawData, dateFields);

    const rowKeys = rowFields.length
      ? getUniqueKeys(processedData, rowFields)
      : [["Total"]];
    const colKeys = colFields.length
      ? getUniqueKeys(processedData, colFields)
      : [["Total"]];

    const pivot = {};
    const avgStore = {};
    const minStore = {};
    const maxStore = {};
    const rowTotals = {};
    const colTotals = {};
    const grandTotals = {};

    processedData.forEach((row) => {
      const rowKey = rowFields.length
        ? rowFields.map((f) => row[f] ?? "Total")
        : ["Total"];
      const colKey = colFields.length
        ? colFields.map((f) => row[f] ?? "Total")
        : ["Total"];

      const rowStr = getKeyStr(rowKey);
      const colStr = getKeyStr(colKey);

      if (!pivot[rowStr]) pivot[rowStr] = {};
      if (!pivot[rowStr][colStr]) pivot[rowStr][colStr] = {};

      valFields.forEach((valField) => {
        const aggFunc = aggregateFuncs[valField] || "sum";
        const rawVal = row[valField];
        const value = cleanNumericValue(rawVal);
        const isValid = !isNaN(value);

        if (aggFunc === "avg") {
          if (!avgStore[rowStr]) avgStore[rowStr] = {};
          if (!avgStore[rowStr][colStr]) avgStore[rowStr][colStr] = {};
          if (!avgStore[rowStr][colStr][valField])
            avgStore[rowStr][colStr][valField] = [];
          if (isValid) avgStore[rowStr][colStr][valField].push(value);
        } else if (aggFunc === "sum") {
          pivot[rowStr][colStr][valField] =
            (pivot[rowStr][colStr][valField] || 0) + (isValid ? value : 0);
        } else if (aggFunc === "count") {
          pivot[rowStr][colStr][valField] =
            (pivot[rowStr][colStr][valField] || 0) + 1;
        } else if (aggFunc === "min") {
          if (!minStore[rowStr]) minStore[rowStr] = {};
          if (!minStore[rowStr][colStr]) minStore[rowStr][colStr] = {};
          minStore[rowStr][colStr][valField] = Math.min(
            minStore[rowStr][colStr][valField] || value,
            value
          );
        } else if (aggFunc === "max") {
          if (!maxStore[rowStr]) maxStore[rowStr] = {};
          if (!maxStore[rowStr][colStr]) maxStore[rowStr][colStr] = {};
          maxStore[rowStr][colStr][valField] = Math.max(
            maxStore[rowStr][colStr][valField] || value,
            value
          );
        }
      });
    });

    for (const rowStr in avgStore) {
      for (const colStr in avgStore[rowStr]) {
        for (const valField in avgStore[rowStr][colStr]) {
          const values = avgStore[rowStr][colStr][valField];
          const sum = values.reduce((acc, v) => acc + v, 0);
          const avg = values.length > 0 ? sum / values.length : 0;
          if (!pivot[rowStr]) pivot[rowStr] = {};
          if (!pivot[rowStr][colStr]) pivot[rowStr][colStr] = {};
          pivot[rowStr][colStr][valField] = avg;
        }
      }
    }
    for (const rowStr in minStore) {
      for (const colStr in minStore[rowStr]) {
        for (const valField in minStore[rowStr][colStr]) {
          pivot[rowStr][colStr][valField] = minStore[rowStr][colStr][valField];
        }
      }
    }
    for (const rowStr in maxStore) {
      for (const colStr in maxStore[rowStr]) {
        for (const valField in maxStore[rowStr][colStr]) {
          pivot[rowStr][colStr][valField] = maxStore[rowStr][colStr][valField];
        }
      }
    }

    const calculateTotal = (values, valField) => {
      if (!values.length) return null;
      const func = aggregateFuncs[valField];
      if (func === "sum" || func === "count")
        return values.reduce((a, b) => a + (b || 0), 0);
      if (func === "avg")
        return values.reduce((a, b) => a + b, 0) / values.length;
      if (func === "min") return Math.min(...values);
      if (func === "max") return Math.max(...values);
      return null;
    };

    rowKeys.forEach((rowKey) => {
      const rowKeyStr = getKeyStr(rowKey);
      rowTotals[rowKeyStr] = {};
      valFields.forEach((valField) => {
        const total = calculateTotal(
          colKeys
            .map((colKey) => pivot[rowKeyStr]?.[getKeyStr(colKey)]?.[valField])
            .filter((v) => v != null && !isNaN(v)),
          valField
        );
        rowTotals[rowKeyStr][valField] = total;
      });
    });

    colKeys.forEach((colKey) => {
      const colKeyStr = getKeyStr(colKey);
      colTotals[colKeyStr] = {};
      valFields.forEach((valField) => {
        const total = calculateTotal(
          rowKeys
            .map((rowKey) => pivot[getKeyStr(rowKey)]?.[colKeyStr]?.[valField])
            .filter((v) => v != null && !isNaN(v)),
          valField
        );
        colTotals[colKeyStr][valField] = total;
      });
    });

    valFields.forEach((valField) => {
      const total = calculateTotal(
        colKeys.flatMap((colKey) =>
          rowKeys
            .map(
              (rowKey) =>
                pivot[getKeyStr(rowKey)]?.[getKeyStr(colKey)]?.[valField]
            )
            .filter((v) => v != null && !isNaN(v))
        ),
        valField
      );
      grandTotals[valField] = total;
    });

    console.log("Pivot Object:", JSON.stringify(pivot, null, 2));
    console.log("Row Totals:", JSON.stringify(rowTotals, null, 2));
    console.log("Col Totals:", JSON.stringify(colTotals, null, 2));
    console.log("Grand Totals:", JSON.stringify(grandTotals, null, 2));

    return {
      pivot,
      rowKeys,
      colKeys,
      valFields,
      aggregateFuncs,
      rowTotals,
      colTotals,
      grandTotals,
    };
  }, [rawData, rowFields, colFields, measures]);
};

const useHeaderData = (colFields, colKeys, valFields, aggregateFuncs) => {
  return useMemo(() => {
    const levels = colFields.length || 1;
    const headerRows = Array(levels + 1)
      .fill()
      .map(() => []);
    const buildHeaderMatrix = (keys, level = 0) => {
      const grouped = groupByLevel(keys, level);
      for (const val in grouped) {
        const group = grouped[val];
        headerRows[level].push({
          value: val,
          span: countLeafCols(group, level + 1, colFields) * valFields.length,
        });
        if (level + 1 < levels) buildHeaderMatrix(group, level + 1);
      }
    };
    buildHeaderMatrix(colKeys);

    headerRows[levels] = colKeys.flatMap(() =>
      valFields.map((val) => ({
        value: `${formatHeader(val)} (${aggregateFuncs[val]})`,
      }))
    );

    if (colFields.length > 0) {
      headerRows.forEach((row, i) => {
        const cells =
          i < levels
            ? [
                {
                  value: i === 0 ? "Total" : "",
                  span: valFields.length,
                  isTotal: true,
                },
              ]
            : valFields.map((val) => ({
                value: `${formatHeader(val)} (${aggregateFuncs[val]})`,
                isTotal: true,
              }));
        row.push(...cells);
      });
    }

    console.log("Header Rows:", JSON.stringify(headerRows, null, 2));
    return headerRows;
  }, [colFields, colKeys, valFields, aggregateFuncs]);
};

const renderCell = ({
  type,
  value,
  key,
  span,
  className,
  rowSpan,
  isTotal,
  children,
}) => {
  if (type === "th") {
    return (
      <th
        key={key}
        colSpan={span || 1}
        rowSpan={rowSpan || 1}
        className={`${className} ${isTotal ? "pivot-total-header" : ""}`}
      >
        {children || value}
      </th>
    );
  }
  return (
    <td
      key={key}
      colSpan={span || 1}
      rowSpan={rowSpan || 1}
      className={className}
    >
      {children || value}
    </td>
  );
};

const PivotTable = ({
  data: rawData,
  rowFields,
  columnFields: colFields,
  measures,
}) => {
  const {
    pivot,
    rowKeys,
    colKeys,
    valFields,
    aggregateFuncs,
    rowTotals,
    colTotals,
    grandTotals,
  } = usePivotData(rawData, rowFields, colFields, measures);

  const headerRows = useHeaderData(
    colFields,
    colKeys,
    valFields,
    aggregateFuncs
  );

  const buildRows = (keys, level = 0) => {
    const grouped = groupByLevel(keys, level);
    const rows = [];

    for (const key in grouped) {
      const group = grouped[key];
      const rowspan = countLeafRows(group, level + 1, rowFields);

      if (level < rowFields.length - 1) {
        buildRows(group, level + 1).forEach((childRow, idx) => {
          if (idx === 0) {
            childRow.unshift(
              renderCell({
                type: "td",
                key: `${level}-${key}`,
                value: key,
                rowSpan: rowspan,
                className: `pivot-row-label pivot-row-label-level-${level}`,
              })
            );
          }
          rows.push(childRow);
        });
      } else {
        const rowKeyStr = getKeyStr(group[0]);
        const dataRow = [];

        colKeys.forEach((colKey) => {
          const colKeyStr = getKeyStr(colKey);
          valFields.forEach((val) => {
            const valNum = pivot[rowKeyStr]?.[colKeyStr]?.[val];
            dataRow.push(
              renderCell({
                type: "td",
                key: `${rowKeyStr}-${colKeyStr}-${val}`,
                value: valNum != null ? formatNumber(valNum) : "",
                className: "pivot-data-cell",
              })
            );
          });
        });

        if (colFields.length > 0) {
          valFields.forEach((val) => {
            const total = rowTotals[rowKeyStr]?.[val];
            dataRow.push(
              renderCell({
                type: "td",
                key: `${rowKeyStr}-total-${val}`,
                value: total != null ? formatNumber(total) : "",
                className: "pivot-row-total",
              })
            );
          });
        }

        rows.push([
          renderCell({
            type: "td",
            key: `${level}-${key}`,
            value: key,
            className: `pivot-row-label pivot-row-label-level-${level}`,
          }),
          ...dataRow,
        ]);
      }
    }

    console.log("Structured Rows Count:", rows.length);
    return rows;
  };

  const renderColHeaders = () => (
    <thead>
      {headerRows.map((row, rowIndex) => (
        <tr key={`header-row-${rowIndex}`} className="pivot-header-row">
          {rowIndex === 0 &&
            rowFields.map((field, j) =>
              renderCell({
                type: "th",
                key: `row-label-${j}`,
                value: formatHeader(field),
                rowSpan: headerRows.length,
                className: "pivot-row-label-header",
              })
            )}
          {row.map((cell, i) =>
            renderCell({
              type: "th",
              key: `header-${i}`,
              value: cell.value,
              span: cell.span,
              className: "pivot-col-header",
              isTotal: cell.isTotal,
            })
          )}
        </tr>
      ))}
    </thead>
  );

  const renderBody = () => {
    let structuredRows = rowFields.length
      ? buildRows(rowKeys)
      : [
          [
            ...colKeys.flatMap((colKey) =>
              valFields.map((val) => {
                const total = colTotals[getKeyStr(colKey)]?.[val];
                return renderCell({
                  type: "td",
                  key: `val-${colKey}-${val}`,
                  value: total != null ? formatNumber(total) : "",
                  className: "pivot-data-cell",
                });
              })
            ),
            ...(colFields.length
              ? valFields.map((val) => {
                  const gt = grandTotals[val];
                  return renderCell({
                    type: "td",
                    key: `grand-${val}`,
                    value: gt != null ? formatNumber(gt) : "",
                    className: "pivot-grand-total",
                  });
                })
              : []),
          ],
        ];

    const totalRow = () => (
      <tr className="pivot-total-row">
        {rowFields.length > 0 &&
          renderCell({
            type: "td",
            key: "total-label",
            span: rowFields.length,
            className: "pivot-total-label",
            children: <strong>Total</strong>,
          })}
        {colKeys.flatMap((colKey) =>
          valFields.map((val) => {
            const value = colTotals[getKeyStr(colKey)]?.[val];
            return renderCell({
              type: "td",
              key: `total-${colKey}-${val}`,
              value: formatNumber(value),
              className: "pivot-column-total",
              children: <strong>{formatNumber(value)}</strong>,
            });
          })
        )}
        {colFields.length > 0 &&
          valFields.map((val) => {
            const gt = grandTotals[val];
            return renderCell({
              type: "td",
              key: `grand-${val}`,
              value: formatNumber(gt),
              className: "pivot-grand-total",
              children: <strong>{formatNumber(gt)}</strong>,
            });
          })}
      </tr>
    );

    console.log(
      "Structured Rows:",
      JSON.stringify(
        structuredRows.map((row) => row.map((cell) => cell.props)),
        null,
        2
      )
    );
    return (
      <tbody>
        {structuredRows.map((cells, i) => (
          <tr key={`row-${i}`} className="pivot-data-row">
            {cells}
          </tr>
        ))}
        {totalRow()}
      </tbody>
    );
  };

  return (
    <div className="pivot-table-root">
      {valFields.length || rowFields.length || colFields.length ? (
        <div className="pivot-table-wrapper">
          <table className="pivot-table-modern">
            {renderColHeaders()}
            {renderBody()}
          </table>
        </div>
      ) : rawData.length > 0 ? (
        <div className="pivot-empty-state">
          <h2>Pivot Table</h2>
          <p>
            Please select fields from the PivotTable Fields List to build your
            report.
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default React.memo(PivotTable);
