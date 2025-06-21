import React, { useState } from 'react';
import axios from '../api/axios';

const DocumentUpload = ({ onSuccess }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    is_public: false
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Only PDF files are allowed');
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', form.title);
      formData.append('description', form.description || '');
      formData.append('is_public', form.is_public);

      await axios.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setForm({ title: '', description: '', is_public: false });
      setFile(null);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="document-upload">
      <h3>Upload Work Document</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Document Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="Enter document title"
          />
        </div>
        
        <div>
          <label htmlFor="description">Description (Optional):</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the work or project"
            rows="3"
          />
        </div>
        
        <div>
          <label htmlFor="file">Select PDF File:</label>
          <input
            type="file"
            id="file"
            accept=".pdf"
            onChange={handleFileChange}
            required
          />
          {file && (
            <div className="file-info">
              <p>Selected: {file.name}</p>
              <p>Size: {formatFileSize(file.size)}</p>
            </div>
          )}
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
          <small>If checked, your manager will be notified and can view this document</small>
        </div>
        
        <button type="submit" disabled={loading || !file}>
          {loading ? 'Uploading...' : 'Upload Document'}
        </button>
        
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
};

export default DocumentUpload; 