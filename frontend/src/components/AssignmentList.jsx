import React, { useState } from 'react';
import axios from '../api/axios';
import AssignmentCommentSection from './AssignmentCommentSection';

const AssignmentList = ({ assignments, isManager, onUpdate, currentUser }) => {
  const [loading, setLoading] = useState({});
  const [expandedAssignment, setExpandedAssignment] = useState(null);

  const handleDownload = async (assignmentId, filename) => {
    setLoading(prev => ({ ...prev, [assignmentId]: true }));
    try {
      const response = await axios.get(`/assignments/${assignmentId}/download`, {
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
      console.error('Failed to download assignment:', error);
      alert('Failed to download assignment');
    } finally {
      setLoading(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  const handleDelete = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) {
      return;
    }
    
    try {
      await axios.delete(`/assignments/${assignmentId}`);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete assignment:', error);
      alert('Failed to delete assignment');
    }
  };

  const toggleComments = (assignmentId) => {
    setExpandedAssignment(expandedAssignment === assignmentId ? null : assignmentId);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (assignments.length === 0) {
    return <p>No assignments found.</p>;
  }

  return (
    <div className="assignment-list">
      {assignments.map(assignment => (
        <div key={assignment.id} className="assignment-item">
          <div className="assignment-header">
            <h4>{assignment.title}</h4>
            <div className="assignment-meta">
              <span>By: {assignment.manager_name}</span>
              <span>Created: {new Date(assignment.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
              {assignment.due_date && (
                <span>Due: {new Date(assignment.due_date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
              )}
              {isManager && (
                <span>Submissions: {assignment.submission_count}</span>
              )}
            </div>
          </div>
          
          {assignment.description && (
            <div className="assignment-description">
              <strong>Description:</strong> {assignment.description}
            </div>
          )}
          
          <div className="assignment-file">
            <strong>File:</strong> {assignment.filename} ({formatFileSize(assignment.file_size)})
          </div>
          
          <div className="assignment-actions">
            <button 
              onClick={() => handleDownload(assignment.id, assignment.filename)}
              disabled={loading[assignment.id]}
            >
              {loading[assignment.id] ? 'Downloading...' : 'Download'}
            </button>
            
            <button 
              onClick={() => toggleComments(assignment.id)}
              style={{ background: '#17a2b8', marginLeft: '0.5rem' }}
            >
              {expandedAssignment === assignment.id ? 'Hide Comments' : 'View Comments'}
            </button>
            
            {isManager && (
              <button 
                onClick={() => handleDelete(assignment.id)}
                style={{ background: '#dc3545', marginLeft: '0.5rem' }}
              >
                Delete
              </button>
            )}
          </div>

          {/* Comments Section */}
          {expandedAssignment === assignment.id && (
            <AssignmentCommentSection 
              assignmentId={assignment.id} 
              currentUser={currentUser}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default AssignmentList; 