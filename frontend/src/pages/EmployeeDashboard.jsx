import React, { useEffect, useState, useCallback, useContext } from 'react';
import axios from '../api/axios';
import FeedbackDetailsModal from '../components/FeedbackDetailsModal';
import PeerFeedbackForm from '../components/PeerFeedbackForm';
import AnnouncementList from '../components/AnnouncementList';
import DocumentUpload from '../components/DocumentUpload';
import DocumentList from '../components/DocumentList';
import AssignmentList from '../components/AssignmentList';
import SubmissionUpload from '../components/SubmissionUpload';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Tabs, Tab, Box, Paper, Card, CardContent, List, ListItem, Button, Typography, Divider, Stack } from '@mui/material';
import { toast } from 'react-toastify';

const EmployeeDashboard = () => {
  const location = useLocation();
  const [timeline, setTimeline] = useState([]);
  const [peerFeedbacks, setPeerFeedbacks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.defaultTab || 'manager');
  const { user } = useContext(AuthContext);

  const fetchTimeline = async () => {
    setLoading(true);
    const res = await axios.get('/dashboard/employee');
    setTimeline(res.data.feedback_timeline);
    setLoading(false);
  };

  const fetchPeerFeedbacks = async () => {
    try {
      const res = await axios.get('/peer-feedback/received');
      setPeerFeedbacks(res.data);
    } catch (err) {
      console.error('Failed to fetch peer feedbacks:', err);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await axios.get('/announcements/my');
      setAnnouncements(res.data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  const loadDocuments = async () => {
    try {
      const res = await axios.get('/documents/my');
      setDocuments(res.data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await axios.get('/assignments/my');
      setAssignments(res.data);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    }
  };

  useEffect(() => {
    fetchTimeline();
    fetchPeerFeedbacks();
    loadAnnouncements();
    loadDocuments();
    loadAssignments();
  }, []);

  useEffect(() => {
    if (location.state?.defaultTab) {
      setActiveTab(location.state.defaultTab);
    }
  }, [location.state]);

  const handleAcknowledge = async (id) => {
    await axios.post(`/feedback/${id}/acknowledge`);
    fetchTimeline();
    setSelectedFeedback(null);
  };

  const handlePeerAcknowledge = async (id) => {
    await axios.post(`/peer-feedback/${id}/acknowledge`);
    fetchPeerFeedbacks();
    toast.success('Peer feedback acknowledged!');
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
  };

  const handleCloseModal = () => {
    setSelectedFeedback(null);
  };

  const handleRequestFeedback = async () => {
    try {
      await axios.post('/feedback/request');
      toast.success('Feedback request sent successfully!');
    } catch (error) {
      toast.error('Failed to send feedback request. You may not have a manager assigned.');
    }
  };

  const handlePeerFeedbackSuccess = () => {
    fetchPeerFeedbacks();
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  if (loading) return <Box p={4}><Typography>Loading...</Typography></Box>;

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" width="100%" mb={2}>
        <Typography variant="h4">Employee Dashboard</Typography>
        <Button variant="contained" onClick={handleRequestFeedback}>Request Feedback</Button>
      </Box>
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Manager Feedback" value="manager" />
          <Tab label="Peer Feedback" value="peer" />
          <Tab label="Announcements" value="announcements" />
          <Tab label="Assignments" value="assignments" />
          <Tab label="Documents" value="documents" />
        </Tabs>
      </Paper>

      {activeTab === 'manager' && (
        <Box>
          <Typography variant="h6" mb={2}>Manager Feedback Timeline</Typography>
          <List>
            {timeline.map(fb => (
              <ListItem key={fb.id} sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography fontWeight={600}>{fb.sentiment}</Typography> - {new Date(fb.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </Box>
                <Box>
                  {fb.acknowledged ? (
                    <Typography color="success.main" fontWeight={700}>Acknowledged</Typography>
                  ) : (
                    <Typography fontStyle="italic" color="warning.main">Pending</Typography>
                  )}
                  <Button onClick={() => handleViewDetails(fb)} sx={{ ml: 2 }} variant="outlined" size="small">View Details</Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {activeTab === 'peer' && (
        <Box>
          <PeerFeedbackForm onSuccess={handlePeerFeedbackSuccess} />
          <Typography variant="h6" mt={3} mb={2}>Received Peer Feedback</Typography>
          {peerFeedbacks.length === 0 ? (
            <Typography>No peer feedback received yet.</Typography>
          ) : (
            <List>
              {peerFeedbacks.map(fb => (
                <ListItem key={fb.id} sx={{ bgcolor: '#f8f9fa', mb: 1, borderRadius: 1, border: '1px solid #dee2e6', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Box width="100%" display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box mb={1}>
                        <Typography fontWeight={600}>{fb.sentiment}</Typography> - {new Date(fb.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        {fb.is_anonymous ? (
                          <Typography component="span" color="text.secondary" fontStyle="italic"> (Anonymous)</Typography>
                        ) : (
                          <Typography component="span" color="primary.main"> from {fb.from_employee_name}</Typography>
                        )}
                      </Box>
                      <Box mb={1}><strong>Strengths:</strong> {fb.strengths}</Box>
                      <Box mb={1}><strong>Areas to Improve:</strong> {fb.areas_to_improve}</Box>
                    </Box>
                    <Box ml={2}>
                      {fb.acknowledged ? (
                        <Typography color="success.main" fontWeight={700}>Acknowledged</Typography>
                      ) : (
                        <Button 
                          onClick={() => handlePeerAcknowledge(fb.id)}
                          variant="contained"
                          color="success"
                          size="small"
                        >
                          Acknowledge
                        </Button>
                      )}
                    </Box>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      )}

      {activeTab === 'announcements' && (
        <Box>
          <Typography variant="h6" mb={2}>Team Announcements</Typography>
          <AnnouncementList 
            announcements={announcements} 
            isManager={false} 
            onUpdate={loadAnnouncements} 
          />
        </Box>
      )}

      {activeTab === 'assignments' && (
        <Box>
          <Typography variant="h6" mb={2}>My Assignments</Typography>
          <AssignmentList 
            assignments={assignments} 
            isManager={false} 
            onUpdate={loadAssignments} 
            currentUser={user}
          />
        </Box>
      )}

      {activeTab === 'documents' && (
        <Box>
          <Typography variant="h6" mb={2}>My Documents</Typography>
          <DocumentUpload onSuccess={loadDocuments} />
          <Typography variant="subtitle1" mt={2}>Uploaded Documents</Typography>
          <DocumentList 
            documents={documents} 
            isManager={false} 
            onUpdate={loadDocuments} 
          />
        </Box>
      )}

      {selectedFeedback && (
        <FeedbackDetailsModal
          feedback={selectedFeedback}
          onClose={handleCloseModal}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </Box>
  );
};

export default EmployeeDashboard; 