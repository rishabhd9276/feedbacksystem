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
import { Tabs, Tab, Box, Paper, Card, CardContent, List, ListItem, ListItemButton, ListItemText, Button, Typography, Divider, Stack } from '@mui/material';

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
  const [activeTab, setActiveTab] = useState('team');

  const fetchAssignments = async () => {
    try {
      const res = await axios.get('/assignments/team');
      setAssignments(res.data);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get('/announcements/team');
      setAnnouncements(res.data);
    } catch (err) {
      console.error("Failed to fetch announcements", err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await axios.get('/documents/team');
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    }
  };

  useEffect(() => {
    axios.get('/dashboard/manager').then(res => setDashboard(res.data));
    axios.get('/users/team').then(res => setTeam(res.data));
    fetchAnnouncements();
    fetchDocuments();
    fetchAssignments();
  }, []);

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

  if (!dashboard) return <Box p={4}><Typography>Loading...</Typography></Box>;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>Manager Dashboard</Typography>
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Team" value="team" />
          <Tab label="Assignments" value="assignments" />
          <Tab label="Announcements" value="announcements" />
          <Tab label="Team Documents" value="documents" />
        </Tabs>
      </Paper>

      {/* Dashboard Tab */}
      {activeTab === 'team' && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography><strong>Team Size:</strong> {dashboard.team_size}</Typography>
              <Typography><strong>Feedback Count:</strong> {dashboard.feedback_count}</Typography>
              <Typography><strong>Sentiment Trends:</strong></Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                {Object.entries(dashboard.sentiment_trends).map(([sentiment, count]) => (
                  <Paper key={sentiment} sx={{ p: 2, minWidth: 120, textAlign: 'center', bgcolor: '#f1f3f6' }}>
                    <Typography>{sentiment}: {count}</Typography>
                  </Paper>
                ))}
              </Stack>
            </CardContent>
          </Card>
          <Typography variant="h6">Team Members</Typography>
          <List>
            {team.map(member => (
              <ListItem key={member.id} disablePadding>
                <ListItemButton onClick={() => selectMember(member)}>
                  <ListItemText primary={`${member.name} (${member.email})`} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          {selected && (
            <Box mt={3}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Feedback for {selected.name}</Typography>
                <Button variant="outlined" onClick={handleExportAllPdf}>Export All as PDF</Button>
              </Box>
              <FeedbackForm employeeId={selected.id} onSuccess={refreshFeedbacks} />
              <Typography variant="subtitle1" sx={{ mt: 2 }}>Feedback History</Typography>
              <List>
                {feedbacks.map(fb => (
                  <ListItem key={fb.id} disablePadding>
                    <FeedbackHistoryItem feedback={fb} onUpdate={refreshFeedbacks} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </Box>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <Box>
          <Typography variant="h6" mb={2}>Upload New Assignment</Typography>
          <AssignmentUpload onUploadSuccess={fetchAssignments} />
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" mb={2}>Current Assignments</Typography>
          <AssignmentList assignments={assignments} onUpdate={fetchAssignments} />
          {selectedAssignment && (
            <Box mt={4}>
              <Typography variant="subtitle1">Submissions for: {selectedAssignment.title}</Typography>
              <SubmissionList 
                submissions={submissions} 
                onUpdate={() => loadSubmissions(selectedAssignment.id)} 
              />
            </Box>
          )}
        </Box>
      )}

      {/* Announcements Tab */}
      {activeTab === 'announcements' && (
        <Box>
          <Typography variant="h6" mb={2}>Create New Announcement</Typography>
          <AnnouncementForm onNewAnnouncement={fetchAnnouncements} />
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" mb={2}>Past Announcements</Typography>
          <AnnouncementList announcements={announcements} onUpdate={fetchAnnouncements}/>
        </Box>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <Box>
          <Typography variant="h6" mb={2}>Team Documents</Typography>
          <DocumentList documents={documents} onUpdate={fetchDocuments}/>
        </Box>
      )}
    </Box>
  );
};

export default ManagerDashboard; 