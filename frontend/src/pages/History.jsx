import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import './History.css';
import { FaDownload } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import axios from 'axios';

function History({ userId }) {
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/history/${userId}`);
        if (response.data && Array.isArray(response.data)) {
          setHistoryData(response.data);
        } else {
          setHistoryData([]); // Nếu dữ liệu không phải là mảng, đặt thành mảng rỗng
        }
      } catch (error) {
        console.error('Error fetching history data:', error);
        setHistoryData([]); // Đặt thành mảng rỗng trong trường hợp lỗi
      }
    };

    fetchHistory();
  }, [userId]);

  const handleDownload = async (id) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/download-zip/${id}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `validation_results_${id}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/history/${id}`);
      setHistoryData(historyData.filter(item => item.idlist_emails !== id));
    } catch (error) {
      console.error('Error deleting history item:', error);
    }
  };

  return (
    <div className="content">
      <Header title="History" />
      <div className="history-content">
        <div className="results-text">Results</div>
        <div className="history-header-box">
          <div className="history-header-text">ID</div>
          <div className="history-header-text">File Name</div>
          <div className="history-header-text">Date</div>
          <div className="history-header-text">Download</div>
          <div className="history-header-text">Delete</div>
        </div>
        <div className="history-body-box">
          {Array.isArray(historyData) && historyData.length > 0 ? (
            historyData.map(item => (
              <div key={item.idlist_emails} className="history-item">
                <div className="history-item-text">{item.idlist_emails}</div>
                <div className="history-item-text">{item.filename}</div>
                <div className="history-item-text">{new Date(item.date).toLocaleDateString()}</div>
                <div className="history-item-icon">
                  <FaDownload onClick={() => handleDownload(item.idlist_emails)} />
                </div>
                <div className="history-item-icon">
                  <MdDelete onClick={() => handleDelete(item.idlist_emails)} />
                </div>
              </div>
            ))
          ) : (
            <div>No history data available.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default History;
