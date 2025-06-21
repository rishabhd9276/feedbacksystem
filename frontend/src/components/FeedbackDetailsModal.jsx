import React from 'react';
import axios from '../api/axios';
import CommentSection from './CommentSection';

const FeedbackDetailsModal = ({ feedback, onClose, onAcknowledge }) => {
  if (!feedback) return null;

  const handleExportPdf = async () => {
    try {
      const response = await axios.get(
        `/feedback/${feedback.id}/export`, 
        { responseType: 'blob' } // Important to handle the binary PDF data
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link to trigger the download
      const link = document.createElement('a');
      link.href = url;
      
      // Attempt to get filename from Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = `feedback_${feedback.id}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      
      // Append to the document, click, and then remove
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export PDF", error);
      alert("Could not download the PDF. Please try again.");
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>Feedback Details</h3>
        <div className="detail-item">
          <strong>Sentiment:</strong> {feedback.sentiment}
        </div>
        <div className="detail-item">
          <strong>Date:</strong> {new Date(feedback.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </div>
        <div className="detail-item">
          <strong>Strengths:</strong>
          <p>{feedback.strengths}</p>
        </div>
        <div className="detail-item">
          <strong>Areas to Improve:</strong>
          <p>{feedback.areas_to_improve}</p>
        </div>
        <div className="detail-item">
          <strong>Acknowledged:</strong>
          {feedback.acknowledged ? 'Yes' : 'No'}
        </div>
        <div className="modal-actions">
          {!feedback.acknowledged && (
            <button onClick={() => onAcknowledge(feedback.id)}>Acknowledge</button>
          )}
          <button onClick={handleExportPdf}>Export to PDF</button>
          <button onClick={onClose} className="secondary">Close</button>
        </div>
        
        {/* Comments Section */}
        <CommentSection 
          feedbackId={feedback.id} 
          currentUserId={feedback.employee_id} 
        />
      </div>
    </div>
  );
};

export default FeedbackDetailsModal; 