import React, { useState } from 'react';
import axios from '../api/axios';

const DocumentItem = ({ document: docItem, isManager, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: docItem.title,
    description: docItem.description || '',
    is_public: docItem.is_public
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.patch(`/documents/${docItem.id}`, form);
      setEditing(false);
      onUpdate();
    } catch (err) {
      setError('Failed to update document');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await axios.delete(`/documents/${docItem.id}`);
        onDelete();
      } catch (err) {
        alert('Failed to delete document');
      }
    }
  };

  const handleDownload = async () => {
    try {
      console.log('Starting download for document:', docItem.id);
      
      const response = await axios.get(`/documents/${docItem.id}/download`, {
        responseType: 'blob'
      });
      
      console.log('Download response:', response);
      console.log('Response data type:', typeof response.data);
      console.log('Response data size:', response.data.size);
      
      if (!response.data || response.data.size === 0) {
        throw new Error('Empty response data');
      }
      
      // Create blob with proper MIME type
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/pdf' 
      });
      
      console.log('Created blob:', blob);
      console.log('Blob size:', blob.size);
      
      // Use a more reliable download method
      const url = window.URL.createObjectURL(blob);
      
      // Create download link using vanilla JavaScript
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = docItem.filename || 'document.pdf';
      downloadLink.style.display = 'none';
      
      // Append to body and trigger download
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Cleanup after a short delay
      setTimeout(() => {
        if (document.body.contains(downloadLink)) {
          document.body.removeChild(downloadLink);
        }
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Download completed successfully');
    } catch (err) {
      console.error('Download error:', err);
      console.error('Error response:', err.response);
      
      // Fallback download method
      try {
        console.log('Trying fallback download method...');
        const response = await axios.get(`/documents/${docItem.id}/download`, {
          responseType: 'blob'
        });
        
        const blob = new Blob([response.data]);
        const url = window.URL.createObjectURL(blob);
        
        // Use window.open as fallback
        window.open(url, '_blank');
        
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
        
        console.log('Fallback download completed');
      } catch (fallbackErr) {
        console.error('Fallback download also failed:', fallbackErr);
        alert('Failed to download document: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (editing) {
    return (
      <div className="document-item editing">
        <form onSubmit={handleEdit}>
          <div>
            <label htmlFor="title">Title:</label>
            <input
              type="text"
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="description">Description:</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows="3"
            />
          </div>
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_public"
                checked={form.is_public}
                onChange={handleChange}
              />
              Make this document visible to my manager
            </label>
          </div>
          <div className="button-group">
            <button type="submit">Save</button>
            <button type="button" onClick={() => setEditing(false)}>Cancel</button>
          </div>
          {error && <div className="error">{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <div className="document-item">
      <div className="document-header">
        <h4>{docItem.title}</h4>
        <div className="document-meta">
          <span>By: {docItem.employee_name}</span>
          <span>{new Date(docItem.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
        </div>
      </div>
      
      {docItem.description && (
        <div className="document-description">
          <p>{docItem.description}</p>
        </div>
      )}
      
      <div className="document-info">
        <span className="file-info">
          <strong>File:</strong> {docItem.filename}
        </span>
        <span className="file-size">
          <strong>Size:</strong> {formatFileSize(docItem.file_size)}
        </span>
        <span className="visibility">
          <strong>Visibility:</strong> {docItem.is_public ? 'Public' : 'Private'}
        </span>
      </div>
      
      {docItem.updated_at && docItem.updated_at !== docItem.created_at && (
        <div className="document-updated">
          <small>Updated: {new Date(docItem.updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</small>
        </div>
      )}
      
      <div className="document-actions">
        <button onClick={handleDownload} className="download-btn">
          Download
        </button>
        {!isManager && (
          <>
            <button onClick={() => setEditing(true)}>Edit</button>
            <button onClick={handleDelete} className="delete-btn">Delete</button>
          </>
        )}
      </div>
    </div>
  );
};

const DocumentList = ({ documents, isManager, onUpdate }) => {
  if (!documents || documents.length === 0) {
    return (
      <div className="document-list empty">
        <p>No documents available.</p>
      </div>
    );
  }

  return (
    <div className="document-list">
      {documents.map(docItem => (
        <DocumentItem
          key={docItem.id}
          document={docItem}
          isManager={isManager}
          onUpdate={onUpdate}
          onDelete={onUpdate}
        />
      ))}
    </div>
  );
};

export default DocumentList; 