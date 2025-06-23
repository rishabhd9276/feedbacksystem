import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
// MUI imports
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import CloseIcon from '@mui/icons-material/Close';
import Popover from '@mui/material/Popover';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'employee') {
      const fetchNotifications = async () => {
        try {
          const res = await axios.get('/notifications');
          setNotifications(res.data);
        } catch (err) {
          console.error('Failed to fetch notifications:', err);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Poll every minute
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await axios.post(`/notifications/${notification.id}/read`);
      setNotifications(notifications.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
    }
    if (user?.role === 'employee') {
      navigate('/employee', { state: { defaultTab: 'announcements' } });
    }
  };

  const handleBellClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const openPopover = Boolean(anchorEl);

  const handleDismissNotification = async (notification) => {
    if (!notification.is_read) {
      await axios.post(`/notifications/${notification.id}/read`);
    }
    setNotifications(notifications.filter(n => n.id !== notification.id));
  };

  if (!user) return null;

  return (
    <AppBar position="static" color="primary" elevation={2}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Welcome, {user.name} ({user.role}) | <b>ID: {user.id}</b>
        </Typography>
        {user.role === 'manager' && (
          <Button color="inherit" component={RouterLink} to="/manager">
            Dashboard
          </Button>
        )}
        {user.role === 'employee' && (
          <Button color="inherit" component={RouterLink} to="/employee">
            Dashboard
          </Button>
        )}
        {(user.role === 'manager' || user.role === 'employee') && (
          <Box sx={{ ml: 2 }}>
            <IconButton color="inherit" onClick={handleBellClick} size="large">
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Popover
              open={openPopover}
              anchorEl={anchorEl}
              onClose={handlePopoverClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { minWidth: 320, maxHeight: 400, overflowY: 'auto' } }}
            >
              <Box p={2} pb={1} display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Notifications</Typography>
                <IconButton aria-label="close" onClick={handlePopoverClose} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box>
                {notifications.length === 0 ? (
                  <Box p={2}><Typography color="text.secondary">No notifications</Typography></Box>
                ) : (
                  notifications.map(n => (
                    <Box
                      key={n.id}
                      sx={{
                        p: 2,
                        borderBottom: '1px solid #eee',
                        bgcolor: n.is_read ? '#f8f9fa' : '#e3f2fd',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1,
                        position: 'relative',
                        '&:hover': { bgcolor: '#e3f2fd' },
                      }}
                    >
                      <Box flex={1} onClick={() => {
                        handleNotificationClick(n);
                        handlePopoverClose();
                      }} sx={{ cursor: 'pointer' }}>
                        <Typography variant="body2" color={n.is_read ? 'text.secondary' : 'text.primary'}>
                          {n.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(n.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      <IconButton
                        aria-label="dismiss"
                        size="small"
                        onClick={() => handleDismissNotification(n)}
                        sx={{ ml: 1 }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))
                )}
              </Box>
            </Popover>
          </Box>
        )}
        <Button color="inherit" onClick={handleLogout} sx={{ ml: 2 }}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar; 