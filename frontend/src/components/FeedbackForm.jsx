import React, { useState } from 'react';
import axios from '../api/axios';

const FeedbackForm = ({ employeeId, onSuccess }) => {
  const [form, setForm] = useState({
    strengths: '',
    areas_to_improve: '',
    sentiment: 'positive',
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
      await axios.post('/feedback/', { ...form, employee_id: employeeId });
      setForm({ strengths: '', areas_to_improve: '', sentiment: 'positive' });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="feedback-form">
      <h4>Submit Feedback</h4>
      <textarea
        name="strengths"
        placeholder="Strengths"
        value={form.strengths}
        onChange={handleChange}
        required
      />
      <textarea
        name="areas_to_improve"
        placeholder="Areas to Improve"
        value={form.areas_to_improve}
        onChange={handleChange}
        required
      />
      <select name="sentiment" value={form.sentiment} onChange={handleChange}>
        <option value="positive">Positive</option>
        <option value="neutral">Neutral</option>
        <option value="negative">Negative</option>
      </select>
      <button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit'}</button>
      {error && <div className="error">{error}</div>}
    </form>
  );
};

export default FeedbackForm; 