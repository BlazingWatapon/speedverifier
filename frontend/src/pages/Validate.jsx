import React, { useState, useRef } from "react";
import Header from "../components/Header";
import "./Validate.css";
import PieChart from "../components/PieChart";
import axios from "axios";

function Validate({ userId }) {
  const [files, setFiles] = useState([]);
  const [emailCount, setEmailCount] = useState(0);
  const [chartData, setChartData] = useState({
    labels: ["Valid", "Invalid", "Do Not Mail", "Unknown"],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: ["#41B06E", "#D21312", "#1c8bc2", "#6962AD"],
        borderColor: "#ffffff",
        borderWidth: 2,
      },
    ],
  });
  const [csvColumns, setCsvColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");

  const onFileChange = async (event) => {
    const newFiles = event.target.files;
    if (newFiles.length > 0) {
      const file = newFiles[0];
      setFiles([file]);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const firstLine = text.split("\n")[0];
        const columns = firstLine.split(",").map((col) => col.trim());
        setCsvColumns(columns);
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = async () => {
    const file = files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);
    formData.append("column", selectedColumn);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const { emailCount, percentages } = response.data;

      setEmailCount(emailCount);

      setChartData((prevState) => ({
        ...prevState,
        datasets: [
          {
            ...prevState.datasets[0],
            data: percentages,
          },
        ],
      }));
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const fileInputRef = useRef();

  const handleClick = () => {
    fileInputRef.current.click();
  };

  const handleColumnChange = (event) => {
    setSelectedColumn(event.target.value);
  };

  const getShortFileName = (fileName) => {
    const baseName = fileName.substring(0, fileName.lastIndexOf("."));
    const shortBaseName = baseName.substring(0, 10);
    const extension = fileName.substring(fileName.lastIndexOf("."));
    return shortBaseName + extension;
  };

  return (
    <div className="validate-content">
      <Header title="Validate" />
      <div className="validate-boxes">
        <div className="validate-statistic-box">
          <div className="status-statistic-box">
            <div className="list-piechart">
              <div className="validate-piechart">
                <PieChart data={chartData} />
              </div>
              <div className="list-total-email">
                <div className="validate-filename">
                  {files.length > 0
                    ? getShortFileName(files[0].name)
                    : "No file selected"}
                </div>
                <div className="list-total-email-line">Total email:</div>
                <div className="number-total-email">{emailCount}</div>
              </div>
            </div>
            <div className="list-statistics">
              <div className="list-overview-display">
                <div className="list-statistics-display">
                  <div className="list-status-item">
                    <div className="list-status-line">STATUS</div>
                    <div className="list-percent-line">% OF EMAILS</div>
                  </div>
                  {chartData.labels.map((label, index) => (
                    <div className="list-status-item" key={index}>
                      <div className="list-status-text">{label}</div>
                      <div
                        className={`percent-${label
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {chartData.datasets[0].data[index]}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="column-select-display">
              <div className="column-select">
                <div className="validate-filename">
                  <div className="select-column-line">File select:</div>
                  {files.length > 0
                    ? getShortFileName(files[0].name)
                    : "No file selected"}
                </div>
                {files.length > 0 && files[0].name.endsWith(".csv") && (
                  <div className="column-display">
                    {csvColumns.length > 0 && (
                      <select
                        value={selectedColumn}
                        onChange={handleColumnChange}
                      >
                        <option value="">Select Column</option>
                        {csvColumns.map((col, index) => (
                          <option key={index} value={col}>
                            {col}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>
              <button
                className="select-column-button"
                onClick={handleFileUpload}
              >
                Select
              </button>
            </div>
          </div>
        </div>
        <div className="upload-list-box">
          <button className="upload-new-list-button" onClick={handleClick}>
            Validate New List
          </button>
          <input
            type="file"
            accept=".txt, .csv"
            onChange={onFileChange}
            ref={fileInputRef}
            className="file-upload"
            style={{ display: "none" }}
          />
        </div>
      </div>
    </div>
  );
}

export default Validate;
