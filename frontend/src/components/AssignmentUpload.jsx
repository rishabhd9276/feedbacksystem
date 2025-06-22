import React, { useState } from 'react';
import axios from '../api/axios';

const AssignmentUpload = ({ onSuccess }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: ''
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Allow multiple file types for assignments
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('File type not allowed. Please upload PDF, Word, text, or image files.');
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
      setError('Please select a file');
      return;
    }

    if (!form.title.trim()) {
      setError('Please enter an assignment title');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', form.title);
      formData.append('description', form.description || '');
      if (form.due_date) {
        formData.append('due_date', form.due_date);
      }

      await axios.post('/assignments/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setForm({ title: '', description: '', due_date: '' });
      setFile(null);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload assignment');
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
    <div className="assignment-upload">
      <h3>Upload Assignment</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Assignment Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="Enter assignment title"
          />
        </div>
        
        <div>
          <label htmlFor="description">Description (Optional):</label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Describe the assignment requirements"
            rows="3"
          />
        </div>
        
        <div>
          <label htmlFor="due_date">Due Date (Optional):</label>
          <input
            type="datetime-local"
            id="due_date"
            name="due_date"
            value={form.due_date}
            onChange={handleChange}
          />
        </div>
        
        <div>
          <label htmlFor="file">Select Assignment File:</label>
          <input
            type="file"
            id="file"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
            onChange={handleFileChange}
            required
          />
          {file && (
            <div className="file-info">
              <p>Selected: {file.name}</p>
              <p>Size: {formatFileSize(file.size)}</p>
              <p>Type: {file.type}</p>
            </div>
          )}
        </div>
        
        <button type="submit" disabled={loading || !file}>
          {loading ? 'Uploading...' : 'Upload Assignment'}
        </button>
        
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
};

export default AssignmentUpload; 