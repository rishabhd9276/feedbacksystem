import React, { useState, useEffect } from 'react';
import axios from '../api/axios';

const PeerFeedbackForm = ({ onSuccess }) => {
  const [form, setForm] = useState({
    to_employee_id: '',
    strengths: '',
    areas_to_improve: '',
    sentiment: 'positive',
    is_anonymous: false
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const response = await axios.get('/peer-feedback/team-members');
      setTeamMembers(response.data);
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('/peer-feedback/', form);
      setForm({
        to_employee_id: '',
        strengths: '',
        areas_to_improve: '',
        sentiment: 'positive',
        is_anonymous: false
      });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
      <h4>Give Peer Feedback</h4>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>
            Select Team Member:
            <select 
              name="to_employee_id" 
              value={form.to_employee_id} 
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            >
              <option value="">Choose a team member...</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            Strengths:
            <textarea 
              name="strengths" 
              value={form.strengths} 
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', minHeight: '80px' }}
              placeholder="What are their key strengths?"
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            Areas to Improve:
            <textarea 
              name="areas_to_improve" 
              value={form.areas_to_improve} 
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem', minHeight: '80px' }}
              placeholder="What areas could they improve on?"
            />
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label>
            Overall Sentiment:
            <select 
              name="sentiment" 
              value={form.sentiment} 
              onChange={handleChange}
              style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
            >
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              name="is_anonymous" 
              checked={form.is_anonymous} 
              onChange={handleChange}
            />
            Submit anonymously
          </label>
        </div>

        {error && <div style={{ color: 'red', marginBottom: '1rem' }}>{error}</div>}

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            background: '#007bff', 
            color: 'white', 
            border: 'none', 
            padding: '0.5rem 1rem', 
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
};

export default PeerFeedbackForm; 