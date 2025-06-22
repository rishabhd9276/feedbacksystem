import React, { useEffect, useState, useContext } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../contexts/AuthContext';
import FeedbackForm from '../components/FeedbackForm';
import AnnouncementForm from '../components/AnnouncementForm';
import AnnouncementList from '../components/AnnouncementList';
import DocumentList from '../components/DocumentList';
import AssignmentUpload from '../components/AssignmentUpload';
import AssignmentList from '../components/AssignmentList';
import SubmissionList from '../components/SubmissionList';

const FeedbackHistoryItem = ({ feedback, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    strengths: feedback.strengths,
    areas_to_improve: feedback.areas_to_improve,
    sentiment: feedback.sentiment,
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.patch(`/feedback/${feedback.id}`, form);
      setEditing(false);
      onUpdate();
    } catch (err) {
      setError('Failed to update feedback');
    }
  };

  if (editing) {
    return (
      <form onSubmit={handleEdit} style={{ marginBottom: '1rem' }}>
        <textarea name="strengths" value={form.strengths} onChange={handleChange} required />
        <textarea name="areas_to_improve" value={form.areas_to_improve} onChange={handleChange} required />
        <select name="sentiment" value={form.sentiment} onChange={handleChange}>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
        <button type="submit">Save</button>
        <button type="button" onClick={() => setEditing(false)} style={{ marginLeft: '0.5rem' }}>Cancel</button>
        {error && <div className="error">{error}</div>}
      </form>
    );
  }

  return (
    <li>
      <strong>{feedback.sentiment}</strong> - {new Date(feedback.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}<br />
      <em>Strengths:</em> {feedback.strengths}<br />
      <em>Areas to Improve:</em> {feedback.areas_to_improve}<br />
      <em>Acknowledged:</em> {feedback.acknowledged ? 'Yes' : 'No'}
      <button onClick={() => setEditing(true)} style={{ marginTop: '0.5rem' }}>Edit</button>
    </li>
  );
};

const ManagerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [dashboard, setDashboard] = useState(null);
  const [team, setTeam] = useState([]);
  const [selected, setSelected] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    axios.get('/dashboard/manager').then(res => setDashboard(res.data));
    axios.get('/users/team').then(res => setTeam(res.data));
    loadAnnouncements();
    loadDocuments();
    loadAssignments();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const res = await axios.get('/announcements/team');
      setAnnouncements(res.data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await axios.get('/documents/team');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await axios.get('/assignments/team');
      setAssignments(res.data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  };

  const loadSubmissions = async (assignmentId) => {
    try {
      const res = await axios.get(`/submissions/assignment/${assignmentId}`);
      setSubmissions(res.data);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    }
  };

  const selectMember = async (member) => {
    setSelected(member);
    const res = await axios.get(`/feedback/employee/${member.id}`);
    setFeedbacks(res.data);
  };

  const selectAssignment = async (assignment) => {
    setSelectedAssignment(assignment);
    await loadSubmissions(assignment.id);
  };

  const refreshFeedbacks = async () => {
    if (selected) {
      const res = await axios.get(`/feedback/employee/${selected.id}`);
      setFeedbacks(res.data);
    }
  };

  const handleExportAllPdf = async () => {
    if (!selected) return;
    try {
      const response = await axios.get(
        `/feedback/employee/${selected.id}/export`, 
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = `feedback_report_${selected.name}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch.length > 1) {
          filename = filenameMatch[1];
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export PDF", error);
      alert("Could not download the PDF. Please try again.");
    }
  };

  if (!dashboard) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <h2>Manager Dashboard</h2>
      
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'assignments' ? 'active' : ''} 
          onClick={() => setActiveTab('assignments')}
        >
          Assignments
        </button>
        <button 
          className={activeTab === 'announcements' ? 'active' : ''} 
          onClick={() => setActiveTab('announcements')}
        >
          Announcements
        </button>
        <button 
          className={activeTab === 'documents' ? 'active' : ''} 
          onClick={() => setActiveTab('documents')}
        >
          Team Documents
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          <div>
            <strong>Team Size:</strong> {dashboard.team_size}<br />
            <strong>Feedback Count:</strong> {dashboard.feedback_count}<br />
            <strong>Sentiment Trends:</strong>
            <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
              {Object.entries(dashboard.sentiment_trends).map(([sentiment, count]) => (
                <div key={sentiment} style={{ background: '#f1f3f6', borderRadius: 10, padding: '1rem 2rem', minWidth: 120, textAlign: 'center' }}>
                  {sentiment}: {count}
                </div>
              ))}
            </div>
          </div>
          <h3>Team Members</h3>
          <ul>
            {team.map(member => (
              <li key={member.id}>
                <button onClick={() => selectMember(member)}>{member.name} ({member.email})</button>
              </li>
            ))}
          </ul>
          {selected && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>Feedback for {selected.name}</h4>
                <button onClick={handleExportAllPdf}>Export All as PDF</button>
              </div>
              <FeedbackForm employeeId={selected.id} onSuccess={refreshFeedbacks} />
              <h5>Feedback History</h5>
              <ul>
                {feedbacks.map(fb => (
                  <FeedbackHistoryItem key={fb.id} feedback={fb} onUpdate={refreshFeedbacks} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div>
          <h3>Team Assignments</h3>
          <AssignmentUpload onSuccess={loadAssignments} />
          
          <h4>Current Assignments</h4>
          <AssignmentList 
            assignments={assignments} 
            isManager={true} 
            onUpdate={loadAssignments} 
            currentUser={user}
          />
          
          {selectedAssignment && (
            <div style={{ marginTop: '2rem' }}>
              <h4>Submissions for: {selectedAssignment.title}</h4>
              <SubmissionList 
                submissions={submissions} 
                onUpdate={() => loadSubmissions(selectedAssignment.id)} 
              />
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <div>
          <h3>Team Announcements</h3>
          <AnnouncementForm onSuccess={loadAnnouncements} />
          <h4>Recent Announcements</h4>
          <AnnouncementList 
            announcements={announcements} 
            isManager={true} 
            onUpdate={loadAnnouncements} 
          />
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div>
          <h3>Team Documents</h3>
          <p>Documents shared by your team members:</p>
          <DocumentList 
            documents={documents} 
            isManager={true} 
            onUpdate={loadDocuments} 
          />
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard; 