import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import axios from '../api/axios';

const CommentSection = ({ feedbackId, currentUserId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [feedbackId]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/comments/feedback/${feedbackId}`);
      setComments(response.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      await axios.post('/comments/', {
        feedback_id: feedbackId,
        content: newComment
      });
      setNewComment('');
      fetchComments();
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      await axios.put(`/comments/${commentId}`, {
        content: editContent
      });
      setEditingComment(null);
      setEditContent('');
      fetchComments();
    } catch (err) {
      console.error('Failed to update comment:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      await axios.delete(`/comments/${commentId}`);
      fetchComments();
    } catch (err) {
      console.error('Failed to delete comment:', err);
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

  return (
    <div style={{ marginTop: '1rem', borderTop: '1px solid #dee2e6', paddingTop: '1rem' }}>
      <h4>Comments</h4>
      
      {/* Add new comment */}
      <form onSubmit={handleSubmitComment} style={{ marginBottom: '1rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            <strong>Add a comment (Markdown supported):</strong>
          </label>
        </div>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write your comment here... You can use **bold**, *italic*, `code`, [links](url), etc."
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '0.5rem',
            border: '1px solid #ced4da',
            borderRadius: '4px',
            fontFamily: 'monospace'
          }}
          required
        />
        <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#6c757d' }}>
          <strong>Markdown tips:</strong> **bold**, *italic*, `code`, [link](url), # heading, - list item
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: '0.5rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Display comments */}
      <div>
        {comments.length === 0 ? (
          <p style={{ color: '#6c757d', fontStyle: 'italic' }}>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map(comment => (
            <div
              key={comment.id}
              style={{
                background: '#f8f9fa',
                padding: '1rem',
                marginBottom: '0.5rem',
                borderRadius: '4px',
                border: '1px solid #dee2e6'
              }}
            >
              {editingComment === comment.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '0.5rem',
                      border: '1px solid #ced4da',
                      borderRadius: '4px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      style={{
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        marginRight: '0.5rem',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      style={{
                        background: '#6c757d',
                        color: 'white',
                        border: 'none',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>{comment.employee_name}</strong>
                    <span style={{ color: '#6c757d', marginLeft: '0.5rem' }}>
                      {new Date(comment.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </span>
                    {comment.updated_at && comment.updated_at !== comment.created_at && (
                      <span style={{ color: '#6c757d', marginLeft: '0.5rem' }}>
                        (edited)
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    background: 'white', 
                    padding: '0.75rem', 
                    borderRadius: '4px',
                    border: '1px solid #e9ecef'
                  }}>
                    <ReactMarkdown>{comment.content}</ReactMarkdown>
                  </div>
                  {comment.employee_id === currentUserId && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <button
                        onClick={() => startEditing(comment)}
                        style={{
                          background: '#ffc107',
                          color: '#212529',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          marginRight: '0.5rem',
                          cursor: 'pointer'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
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

export default CommentSection; 