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
      alert('Feedback request sent successfully!');
    } catch (error) {
      alert('Failed to send feedback request. You may not have a manager assigned.');
    }
  };

  const handlePeerFeedbackSuccess = () => {
    fetchPeerFeedbacks();
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="dashboard-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <h2>Employee Dashboard</h2>
        <button onClick={handleRequestFeedback}>Request Feedback</button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', marginBottom: '1rem', borderBottom: '1px solid #ddd' }}>
        <button 
          onClick={() => handleTabClick('manager')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: activeTab === 'manager' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'manager' ? 'white' : '#333',
            cursor: 'pointer',
            borderBottom: activeTab === 'manager' ? '2px solid #007bff' : 'none'
          }}
        >
          Manager Feedback
        </button>
        <button 
          onClick={() => handleTabClick('peer')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: activeTab === 'peer' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'peer' ? 'white' : '#333',
            cursor: 'pointer',
            borderBottom: activeTab === 'peer' ? '2px solid #007bff' : 'none'
          }}
        >
          Peer Feedback
        </button>
        <button 
          onClick={() => handleTabClick('announcements')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: activeTab === 'announcements' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'announcements' ? 'white' : '#333',
            cursor: 'pointer',
            borderBottom: activeTab === 'announcements' ? '2px solid #007bff' : 'none'
          }}
        >
          Announcements
        </button>
        <button 
          onClick={() => handleTabClick('assignments')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: activeTab === 'assignments' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'assignments' ? 'white' : '#333',
            cursor: 'pointer',
            borderBottom: activeTab === 'assignments' ? '2px solid #007bff' : 'none'
          }}
        >
          Assignments
        </button>
        <button 
          onClick={() => handleTabClick('documents')}
          style={{
            padding: '0.5rem 1rem',
            border: 'none',
            background: activeTab === 'documents' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'documents' ? 'white' : '#333',
            cursor: 'pointer',
            borderBottom: activeTab === 'documents' ? '2px solid #007bff' : 'none'
          }}
        >
          Documents
        </button>
      </div>

      {activeTab === 'manager' && (
        <>
          <h3>Manager Feedback Timeline</h3>
          <ul>
            {timeline.map(fb => (
              <li key={fb.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{fb.sentiment}</strong> - {new Date(fb.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                </div>
                <div>
                  {fb.acknowledged ? (
                    <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>Acknowledged</span>
                  ) : (
                    <span style={{ fontStyle: 'italic', color: '#e67e22' }}>Pending</span>
                  )}
                  <button onClick={() => handleViewDetails(fb)} style={{ marginLeft: '1rem' }}>
                    View Details
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {activeTab === 'peer' && (
        <>
          <PeerFeedbackForm onSuccess={handlePeerFeedbackSuccess} />
          
          <h3>Received Peer Feedback</h3>
          {peerFeedbacks.length === 0 ? (
            <p>No peer feedback received yet.</p>
          ) : (
            <ul>
              {peerFeedbacks.map(fb => (
                <li key={fb.id} style={{ 
                  background: '#f8f9fa', 
                  padding: '1rem', 
                  marginBottom: '0.5rem', 
                  borderRadius: '4px',
                  border: '1px solid #dee2e6'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>{fb.sentiment}</strong> - {new Date(fb.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                        {fb.is_anonymous ? (
                          <span style={{ color: '#6c757d', fontStyle: 'italic' }}> (Anonymous)</span>
                        ) : (
                          <span style={{ color: '#007bff' }}> from {fb.from_employee_name}</span>
                        )}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Strengths:</strong> {fb.strengths}
                      </div>
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Areas to Improve:</strong> {fb.areas_to_improve}
                      </div>
                    </div>
                    <div style={{ marginLeft: '1rem' }}>
                      {fb.acknowledged ? (
                        <span style={{ color: '#2ecc71', fontWeight: 'bold' }}>Acknowledged</span>
                      ) : (
                        <button 
                          onClick={() => handlePeerAcknowledge(fb.id)}
                          style={{ 
                            background: '#28a745', 
                            color: 'white', 
                            border: 'none', 
                            padding: '0.25rem 0.5rem', 
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {activeTab === 'announcements' && (
        <>
          <h3>Team Announcements</h3>
          <AnnouncementList 
            announcements={announcements} 
            isManager={false} 
            onUpdate={loadAnnouncements} 
          />
        </>
      )}

      {activeTab === 'assignments' && (
        <>
          <h3>My Assignments</h3>
          <AssignmentList 
            assignments={assignments} 
            isManager={false} 
            onUpdate={loadAssignments} 
            currentUser={user}
          />
        </>
      )}

      {activeTab === 'documents' && (
        <>
          <h3>My Documents</h3>
          <DocumentUpload onSuccess={loadDocuments} />
          <h4>Uploaded Documents</h4>
          <DocumentList 
            documents={documents} 
            isManager={false} 
            onUpdate={loadDocuments} 
          />
        </>
      )}

      {selectedFeedback && (
        <FeedbackDetailsModal
          feedback={selectedFeedback}
          onClose={handleCloseModal}
          onAcknowledge={handleAcknowledge}
        />
      )}
    </div>
  );
};

export default EmployeeDashboard; 