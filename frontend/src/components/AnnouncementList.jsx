import React, { useState } from 'react';
import axios from '../api/axios';

const AnnouncementItem = ({ announcement, isManager, onUpdate, onDelete }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    title: announcement.title,
    content: announcement.content
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.patch(`/announcements/${announcement.id}`, form);
      setEditing(false);
      onUpdate();
    } catch (err) {
      setError('Failed to update announcement');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await axios.delete(`/announcements/${announcement.id}`);
        onDelete();
      } catch (err) {
        alert('Failed to delete announcement');
      }
    }
  };

  if (editing) {
    return (
      <div className="announcement-item editing">
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
            <label htmlFor="content">Content:</label>
            <textarea
              id="content"
              name="content"
              value={form.content}
              onChange={handleChange}
              required
              rows="4"
            />
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
    <div className="announcement-item">
      <div className="announcement-header">
        <h4>{announcement.title}</h4>
        <div className="announcement-meta">
          <span>By: {announcement.manager_name}</span>
          <span>{new Date(announcement.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</span>
        </div>
      </div>
      <div className="announcement-content">
        <p>{announcement.content}</p>
      </div>
      {announcement.updated_at && announcement.updated_at !== announcement.created_at && (
        <div className="announcement-updated">
          <small>Updated: {new Date(announcement.updated_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</small>
        </div>
      )}
      {isManager && (
        <div className="announcement-actions">
          <button onClick={() => setEditing(true)}>Edit</button>
          <button onClick={handleDelete} className="delete-btn">Delete</button>
        </div>
      )}
    </div>
  );
};

const AnnouncementList = ({ announcements, isManager, onUpdate }) => {
  if (!announcements || announcements.length === 0) {
    return (
      <div className="announcement-list empty">
        <p>No announcements available.</p>
      </div>
    );
  }

  const handleUpdate = async (id, form) => {
    try {
      await axios.patch(`/announcements/${id}`, form);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/announcements/${id}`);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  return (
    <div className="announcement-list">
      {announcements.map(announcement => (
        <AnnouncementItem
          key={announcement.id}
          announcement={announcement}
          isManager={isManager}
          onUpdate={onUpdate}
          onDelete={onUpdate}
        />
      ))}
    </div>
  );
};

export default AnnouncementList; 