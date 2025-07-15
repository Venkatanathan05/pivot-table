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
  data,
}) => {
  const [draggedField, setDraggedField] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  const isNumericalField = (field) => {
    const isDateDerived = field.match(/_(Year|Month|Day)$/);
    if (isDateDerived) return false;

    const isDateField = data.some((row) => {
      const value = row[field];
      return typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}$/);
    });
    if (isDateField) return false;

    return data.every((row) => {
      const value = row[field];
      if (value === "" || value == null) return true;
      return !isNaN(parseFloat(value)) && isFinite(value);
    });
  };

  const handleDragStart = (field, type) => {
    setDraggedField({ field, type });
    setDragOver(null);
  };

  const handleDragOver = (e, targetType) => {
    e.preventDefault();
    setDragOver(targetType);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (targetType) => {
    if (draggedField) {
      if (targetType === "measure") {
        const isDateDerived = draggedField.field.match(/_(Year|Month|Day)$/);
        const isDateField = data.some((row) => {
          const value = row[draggedField.field];
          return (
            typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}$/)
          );
        });
        if (isDateDerived || isDateField) {
          alert("Date-related fields cannot be added to measures.");
          setDraggedField(null);
          setDragOver(null);
          return;
        }
        if (!isNumericalField(draggedField.field)) {
          alert("Only numerical fields can be added to measures.");
          setDraggedField(null);
          setDragOver(null);
          return;
        }
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
      setDragOver(null);
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "20px",
            }}
          >
            <div
              className={`dropzone ${dragOver === "row" ? "drag-over" : ""}`}
              onDrop={() => handleDrop("row")}
              onDragOver={(e) => handleDragOver(e, "row")}
              onDragLeave={handleDragLeave}
              aria-label="Drop zone for row fields"
            >
              <h5>Rows</h5>
              {rowFields.map((field, index) => (
                <div key={index} className="draggable-item">
                  {field}
                  <span
                    onClick={() =>
                      setRowFields(rowFields.filter((f) => f !== field))
                    }
                    role="button"
                    aria-label={`Remove ${field} from rows`}
                    style={{ cursor: "pointer" }}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>

            <div
              className={`dropzone ${dragOver === "column" ? "drag-over" : ""}`}
              onDrop={() => handleDrop("column")}
              onDragOver={(e) => handleDragOver(e, "column")}
              onDragLeave={handleDragLeave}
              aria-label="Drop zone for column fields"
            >
              <h5>Columns</h5>
              {columnFields.map((field, index) => (
                <div key={index} className="draggable-item">
                  {field}
                  <span
                    onClick={() =>
                      setColumnFields(columnFields.filter((f) => f !== field))
                    }
                    role="button"
                    aria-label={`Remove ${field} from columns`}
                    style={{ cursor: "pointer" }}
                  >
                    ×
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`dropzone ${dragOver === "measure" ? "drag-over" : ""}`}
            onDrop={() => handleDrop("measure")}
            onDragOver={(e) => handleDragOver(e, "measure")}
            onDragLeave={handleDragLeave}
            aria-label="Drop zone for measures"
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
                  aria-label={`Aggregation for ${field}`}
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
                  role="button"
                  aria-label={`Remove ${field} from measures`}
                  style={{ cursor: "pointer" }}
                >
                  ×
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="pivot-right">
          <div className="zones-container">
            <h5>Available Fields</h5>
            {getAvailableFields().map((field, index) => (
              <div
                key={index}
                className="draggable-item"
                draggable
                onDragStart={() => handleDragStart(field, "field")}
                role="button"
                aria-label={`Drag ${field}`}
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
