import React, { useState } from 'react';
import axios from '../api/axios';
import { Card, CardContent, TextField, Button, Typography, Stack, Box, InputLabel } from '@mui/material';
import { toast } from 'react-toastify';

const SubmissionUpload = ({ assignmentId, assignmentTitle, onSuccess }) => {
  const [form, setForm] = useState({
    title: '',
    description: ''
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
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Please enter a submission title');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('assignment_id', assignmentId);
      formData.append('title', form.title);
      formData.append('description', form.description || '');
      await axios.post('/submissions/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setForm({ title: '', description: '' });
      setFile(null);
      toast.success('Submission uploaded successfully!');
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to upload submission');
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
        <Typography variant="h6" gutterBottom>Submit Work for: {assignmentTitle}</Typography>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              label="Submission Title"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              fullWidth
              placeholder="Enter submission title"
            />
            <TextField
              label="Description (Optional)"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Describe your submission"
              multiline
              rows={3}
              fullWidth
            />
            <Box>
              <InputLabel htmlFor="file">Select Submission File</InputLabel>
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
              {loading ? 'Uploading...' : 'Submit Work'}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SubmissionUpload; 