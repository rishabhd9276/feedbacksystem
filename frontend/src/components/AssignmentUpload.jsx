import React, { useState } from 'react';
import axios from '../api/axios';
import { Card, CardContent, TextField, Button, Typography, Stack, Box, InputLabel } from '@mui/material';
import { toast } from 'react-toastify';

const AssignmentUpload = ({ onUploadSuccess }) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: ''
  });
  const [file, setFile] = useState(null);
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
        toast.error('File type not allowed. Please upload PDF, Word, text, or image files.');
        setFile(null);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !form.title) {
      toast.error('File and title are required.');
      return;
    }
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
      toast.success('Assignment uploaded successfully!');
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload assignment');
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
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Upload Assignment</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Assignment Title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              fullWidth
              placeholder="Enter assignment title"
            />
            <TextField
              label="Description (Optional)"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe the assignment requirements"
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Due Date (Optional)"
              name="due_date"
              type="datetime-local"
              value={form.due_date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Box>
              <InputLabel htmlFor="file">Select Assignment File</InputLabel>
              <input
                type="file"
                id="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                onChange={handleFileChange}
                required
                style={{ marginTop: 8 }}
              />
              {file && (
                <Box mt={1}>
                  <Typography variant="body2">Selected: {file.name}</Typography>
                  <Typography variant="body2">Size: {formatFileSize(file.size)}</Typography>
                  <Typography variant="body2">Type: {file.type}</Typography>
                </Box>
              )}
            </Box>
            <Button type="submit" variant="contained" disabled={loading || !file}>
              {loading ? 'Uploading...' : 'Upload Assignment'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AssignmentUpload; 