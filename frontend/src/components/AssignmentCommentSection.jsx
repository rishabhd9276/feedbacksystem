import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import './AssignmentCommentSection.css';

const AssignmentCommentSection = ({ assignmentId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (assignmentId) {
      fetchComments();
    }
  }, [assignmentId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/assignment-comments/assignment/${assignmentId}`);
      setComments(response.data);
    } catch (err) {
      setError('Failed to load comments');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    setError('');

    try {
      await axios.post('/assignment-comments/', {
        assignment_id: assignmentId,
        content: newComment.trim()
      });

      setNewComment('');
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await axios.put(`/assignment-comments/${commentId}`, {
        content: editContent.trim()
      });

      setEditingComment(null);
      setEditContent('');
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await axios.delete(`/assignment-comments/${commentId}`);
      fetchComments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete comment');
    }
  };

  const startEditing = (comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="assignment-comment-section">
      <h3>Comments & Questions</h3>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Add new comment */}
      <form onSubmit={handleSubmitComment} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Share your thoughts, ask questions, or provide clarifications about this assignment..."
          rows="3"
          required
        />
        <button type="submit" disabled={loading || !newComment.trim()}>
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments list */}
      <div className="comments-list">
        {comments.length === 0 ? (
          <p className="no-comments">No comments yet. Be the first to start the discussion!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{comment.employee_name}</span>
                <span className="comment-date">{formatDate(comment.created_at)}</span>
                {comment.updated_at && comment.updated_at !== comment.created_at && (
                  <span className="comment-edited">(edited)</span>
                )}
              </div>
              
              {editingComment === comment.id ? (
                <div className="comment-edit-form">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows="3"
                  />
                  <div className="edit-actions">
                    <button 
                      onClick={() => handleEditComment(comment.id)}
                      disabled={!editContent.trim()}
                    >
                      Save
                    </button>
                    <button onClick={cancelEditing}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="comment-content">
                  <p>{comment.content}</p>
                  {currentUser && comment.employee_id === currentUser.id && (
                    <div className="comment-actions">
                      <button 
                        onClick={() => startEditing(comment)}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AssignmentCommentSection; 