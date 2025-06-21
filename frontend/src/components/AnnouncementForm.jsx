import React, { useState } from 'react';
import axios from '../api/axios';

const AnnouncementForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    title: '',
    content: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/announcements/', form);
      setForm({ title: '', content: '' });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="announcement-form">
      <h3>Create New Announcement</h3>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title:</label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            placeholder="Enter announcement title"
          />
        </div>
        <div>
          <label htmlFor="content">Content:</label>
          <textarea
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            required
            placeholder="Enter announcement content"
            rows="4"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Announcement'}
        </button>
        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
};

export default AnnouncementForm; 