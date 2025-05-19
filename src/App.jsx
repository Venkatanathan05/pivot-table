import { useState } from "react";
import FileUploader from "./components/FileUploader.jsx";
import PivotTable from "./components/PivotTable.jsx";
import PivotFunctions from "./components/PivotFunctions.jsx";
import "./styles/App.css";

const App = () => {
  const [data, setData] = useState([]);
  const [fields, setFields] = useState([]);
  const [rowFields, setRowFields] = useState([]);
  const [columnFields, setColumnFields] = useState([]);
  const [measures, setMeasures] = useState([]);
  const [dateField, setDateField] = useState(null);
  const [datePart, setDatePart] = useState("");

  const handleUpload = (parsedData) => {
    setData(parsedData);
    const keys = Object.keys(parsedData[0] || {});
    setFields(keys);
    setRowFields([]);
    setColumnFields([]);
    setMeasures([]);
    setDateField(null);
    setDatePart("");
  };

  const showPivotTable = rowFields.length > 0 || columnFields.length > 0;

  return (
    <>
      <FileUploader onUpload={handleUpload} />

      <div className="container">
        {data.length > 0 && (
          <div className="mainContent">
            <div className="leftPanel">
              {showPivotTable ? (
                <PivotTable
                  data={data}
                  rowFields={rowFields}
                  columnFields={columnFields}
                  measures={measures}
                  dateField={dateField}
                  datePart={datePart}
                />
              ) : (
                <div className="previewBox">
                  <h3 className="previewTitle">CSV Preview</h3>
                  <div className="tableWrapper">
                    <table className="previewTable">
                      <thead>
                        <tr>
                          {fields.map((field) => (
                            <th key={field}>{field}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {fields.map((field) => (
                              <td key={field}>{row[field]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <PivotFunctions
                fields={fields}
                rowFields={rowFields}
                setRowFields={setRowFields}
                columnFields={columnFields}
                setColumnFields={setColumnFields}
                measures={measures}
                setMeasures={setMeasures}
                dateField={dateField}
                setDateField={setDateField}
                datePart={datePart}
                setDatePart={setDatePart}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default App;
