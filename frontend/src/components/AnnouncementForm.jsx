import React, { useState } from 'react';
import axios from '../api/axios';

const AnnouncementForm = ({ onNewAnnouncement }) => {
  const [form, setForm] = useState({
    title: '',
    content: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/announcements/', form);
      setForm({ title: '', content: '' });
      if (onNewAnnouncement) {
        onNewAnnouncement();
      }
    } catch (err) {
      setError('Failed to create announcement');
    }
  };

  return (
    <div className="announcement-form">
      <h3>Create New Announcement</h3>
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
          placeholder="Title"
          className="w-full p-2 border rounded"
            required
          />
          <textarea
            name="content"
            value={form.content}
            onChange={handleChange}
          placeholder="Content"
          className="w-full p-2 border rounded"
            required
        ></textarea>
        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Create
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
};

export default AnnouncementForm; 