import React, { useState } from 'react';
import axios from '../api/axios';

const SubmissionList = ({ submissions, onUpdate }) => {
  const [loading, setLoading] = useState({});

  const handleDownload = async (submissionId, filename) => {
    setLoading(prev => ({ ...prev, [submissionId]: true }));
    try {
      const response = await axios.get(`/submissions/${submissionId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download submission:', error);
      alert('Failed to download submission');
    } finally {
      setLoading(prev => ({ ...prev, [submissionId]: false }));
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (submissions.length === 0) {
    return <p>No submissions found.</p>;
  }

  return (
    <div className="submission-list">
      {submissions.map(submission => (
        <div key={submission.id} className="submission-item">
          <div className="submission-header">
            <h4>{submission.title}</h4>
            <div className="submission-meta">
              <span>By: {submission.employee_name}</span>
              <span>Submitted: {new Date(submission.submitted_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
            </div>
          </div>
          
          {submission.description && (
            <div className="submission-description">
              <strong>Description:</strong> {submission.description}
            </div>
          )}
          
          <div className="submission-file">
            <strong>File:</strong> {submission.filename} ({formatFileSize(submission.file_size)})
          </div>
          
          <div className="submission-actions">
            <button 
              onClick={() => handleDownload(submission.id, submission.filename)}
              disabled={loading[submission.id]}
            >
              {loading[submission.id] ? 'Downloading...' : 'Download Submission'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SubmissionList; 