import React from "react";
const OriginalTable = ({ data }) => (
  <div>
    <h3>Original CSV Data</h3>
    <div style={{ overflowX: "auto", maxWidth: "100%", whiteSpace: "nowrap" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {data[0].map((head, i) => (
              <th key={i} style={{ border: "1px solid #ddd", padding: "8px" }}>
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(1).map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  style={{ border: "1px solid #ddd", padding: "8px" }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default React.memo(OriginalTable);
