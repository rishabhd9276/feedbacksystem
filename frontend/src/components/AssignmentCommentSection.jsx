import React, { useState, useEffect } from 'react';
import axios from '../api/axios';
import { Card, CardContent, TextField, Button, Typography, Stack, Box, Divider } from '@mui/material';
import { toast } from 'react-toastify';

const AssignmentCommentSection = ({ assignmentId, currentUser }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
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
      toast.error('Failed to load comments');
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLoading(true);
    try {
      await axios.post('/assignment-comments/', {
        assignment_id: assignmentId,
        content: newComment.trim()
      });
      setNewComment('');
      fetchComments();
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to post comment');
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
      toast.success('Comment updated!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await axios.delete(`/assignment-comments/${commentId}`);
      fetchComments();
      toast.success('Comment deleted!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete comment');
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
    <Card sx={{ mt: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Comments & Questions</Typography>
        <Box component="form" onSubmit={handleSubmitComment} mb={2}>
          <Stack spacing={2}>
            <TextField
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts, ask questions, or provide clarifications about this assignment..."
              multiline
              rows={3}
              required
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={loading || !newComment.trim()}>
              {loading ? 'Posting...' : 'Post Comment'}
            </Button>
          </Stack>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Box>
          {comments.length === 0 ? (
            <Typography color="text.secondary">No comments yet. Be the first to start the discussion!</Typography>
          ) : (
            <Stack spacing={2}>
              {comments.map((comment) => (
                <Box key={comment.id} sx={{ bgcolor: '#f8f9fa', borderRadius: 2, p: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography fontWeight={600}>{comment.employee_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{formatDate(comment.created_at)}{comment.updated_at && comment.updated_at !== comment.created_at && ' (edited)'}</Typography>
                  </Box>
                  {editingComment === comment.id ? (
                    <Box mt={1}>
                      <TextField
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        multiline
                        rows={3}
                        fullWidth
                      />
                      <Stack direction="row" spacing={1} mt={1}>
                        <Button 
                          onClick={() => handleEditComment(comment.id)}
                          disabled={!editContent.trim()}
                          variant="contained"
                          size="small"
                        >
                          Save
                        </Button>
                        <Button onClick={cancelEditing} variant="outlined" size="small">Cancel</Button>
                      </Stack>
                    </Box>
                  ) : (
                    <Box mt={1}>
                      <Typography>{comment.content}</Typography>
                      {currentUser && comment.employee_id === currentUser.id && (
                        <Stack direction="row" spacing={1} mt={1}>
                          <Button 
                            onClick={() => startEditing(comment)}
                            variant="outlined"
                            size="small"
                          >
                            Edit
                          </Button>
                          <Button 
                            onClick={() => handleDeleteComment(comment.id)}
                            color="error"
                            variant="outlined"
                            size="small"
                          >
                            Delete
                          </Button>
                        </Stack>
                      )}
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AssignmentCommentSection; 