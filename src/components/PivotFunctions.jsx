import React, { useState } from "react";
import "../styles/PivotFunctions.css";

const PivotFunctions = ({
  fields,
  rowFields,
  setRowFields,
  columnFields,
  setColumnFields,
  measures,
  setMeasures,
}) => {
  const [draggedField, setDraggedField] = useState(null);

  const handleDragStart = (field, type) => {
    setDraggedField({ field, type });
  };

  const handleDrop = (targetType) => {
    if (draggedField) {
      if (targetType === "measure") {
        if (!measures.find((m) => m.field === draggedField.field)) {
          setMeasures([
            ...measures,
            { field: draggedField.field, aggregation: "SUM" },
          ]);
        }
      } else if (
        targetType === "row" &&
        !rowFields.includes(draggedField.field)
      ) {
        setRowFields([...rowFields, draggedField.field]);
      } else if (
        targetType === "column" &&
        !columnFields.includes(draggedField.field)
      ) {
        setColumnFields([...columnFields, draggedField.field]);
      }
      setDraggedField(null);
    }
  };

  const handleAggregationChange = (field, aggregation) => {
    setMeasures(
      measures.map((m) => (m.field === field ? { ...m, aggregation } : m))
    );
  };

  const getAvailableFields = () => {
    const assignedFields = [
      ...rowFields,
      ...columnFields,
      ...measures.map((m) => m.field),
    ];
    return fields.filter((field) => !assignedFields.includes(field));
  };

  return (
    <div className="pivot-controls-container">
      <h4>PIVOT FUNCTIONS</h4>
      <div className="pivot-controls-wrapper">
        <div className="pivot-left">
          {/* Rows and Columns */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
            }}
          >
            <div
              className="dropzone"
              onDrop={() => handleDrop("row")}
              onDragOver={(e) => e.preventDefault()}
            >
              <h5>Rows</h5>
              {rowFields.map((field, index) => (
                <div key={index} className="draggable-item">
                  {field}
                  <span
                    onClick={() =>
                      setRowFields(rowFields.filter((f) => f !== field))
                    }
                    style={{ cursor: "pointer" }}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>

            <div
              className="dropzone"
              onDrop={() => handleDrop("column")}
              onDragOver={(e) => e.preventDefault()}
            >
              <h5>Columns</h5>
              {columnFields.map((field, index) => (
                <div key={index} className="draggable-item">
                  {field}
                  <span
                    onClick={() =>
                      setColumnFields(columnFields.filter((f) => f !== field))
                    }
                    style={{ cursor: "pointer" }}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Measures */}
          <div
            className="dropzone"
            onDrop={() => handleDrop("measure")}
            onDragOver={(e) => e.preventDefault()}
          >
            <h5>Measures</h5>
            {measures.map(({ field, aggregation }, index) => (
              <div key={index} className="draggable-item">
                {field} ({aggregation})
                <select
                  value={aggregation}
                  onChange={(e) =>
                    handleAggregationChange(field, e.target.value)
                  }
                  className="agg-select"
                >
                  <option value="SUM">SUM</option>
                  <option value="AVERAGE">AVERAGE</option>
                  <option value="COUNT">COUNT</option>
                  <option value="MIN">MIN</option>
                  <option value="MAX">MAX</option>
                </select>
                <span
                  onClick={() =>
                    setMeasures(measures.filter((m) => m.field !== field))
                  }
                  style={{ cursor: "pointer" }}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="pivot-right">
          {/* Available Fields */}
          <div className="zones-container">
            <h5>Available Fields</h5>
            {getAvailableFields().map((field, index) => (
              <div
                key={index}
                className="draggable-item"
                draggable
                onDragStart={() => handleDragStart(field, "field")}
              >
                {field}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PivotFunctions);
