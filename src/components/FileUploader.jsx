import React, { useState } from "react";
import "../styles/FileUploader.css"; // Ensure path is correct

const FileUploader = ({ onUpload }) => {
  const [uploadStatus, setUploadStatus] = useState("");
  const [messageType, setMessageType] = useState("");

  const parseCSV = (text) => {
    const [headerLine, ...lines] = text.trim().split("\n");
    const headers = headerLine.split(",");

    // Iterate through each line and process the data
    return lines.map((line) => {
      const values = line.split(",");

      // Create a new object based on headers and values
      const rowData = headers.reduce((acc, h, i) => {
        const value = values[i];

        // Check if the value is a valid date and process the Year, Month, and Day
        if (isValidDate(value)) {
          const date = new Date(value);
          acc[`${h}_Year`] = date.getFullYear();
          acc[`${h}_Month`] = date.getMonth() + 1; // Month is 0-based
          acc[`${h}_Day`] = date.getDate();
        }

        // Keep the original date field
        acc[h] = value;

        return acc;
      }, {});

      return rowData;
    });
  };

  // Helper function to check if a value is a valid date
  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/; // Match format YYYY-MM-DD
    return dateString.match(regex) !== null;
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== "text/csv") {
        setUploadStatus("Error: Please upload a valid CSV file.");
        setMessageType("error");
        return;
      }

      setUploadStatus("Uploading...");
      setMessageType("");
      const reader = new FileReader();
      reader.onload = () => {
        const data = parseCSV(reader.result);
        onUpload(data);
        setUploadStatus("Upload successful!");
        setMessageType("success");
      };
      reader.onerror = () => {
        setUploadStatus("Error: Could not read file.");
        setMessageType("error");
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="csv-upload-container">
      <label className="csv-upload-button">
        Choose CSV File
        <input
          className="csv-upload-input"
          type="file"
          accept=".csv"
          onChange={handleChange}
        ></input>
      </label>

      {uploadStatus && (
        <span
          className={
            messageType === "success"
              ? "csv-upload-success"
              : "csv-upload-error"
          }
        >
          {uploadStatus}
        </span>
      )}
    </div>
  );
};

export default React.memo(FileUploader);
