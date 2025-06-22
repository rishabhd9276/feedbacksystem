import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../api/axios';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user?.role === 'manager' || user?.role === 'employee') {
      const fetchNotifications = async () => {
        try {
            const res = await axios.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications:", err)
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
    setShowNotifications(false);
    if (user?.role === 'employee') {
      navigate('/employee', { state: { defaultTab: 'announcements' } });
    }
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <span>
        Welcome, {user.name} ({user.role}) | <b>ID: {user.id}</b>
      </span>
      {user.role === 'manager' && <Link to="/manager">Dashboard</Link>}
      {user.role === 'employee' && <Link to="/employee">Dashboard</Link>}
      
      {(user.role === 'manager' || user.role === 'employee') && (
        <div className="notification-container">
          <button className="notification-bell" onClick={() => setShowNotifications(!showNotifications)}>
            &#128276; 
            {unreadCount > 0 && (
                <span className="notification-count">
                    {user.role === 'manager' ? unreadCount : "New"}
                </span>
            )}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              {notifications.length === 0 ? (
                <div className="notification-item">No notifications</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`notification-item ${n.is_read ? 'read' : ''}`} onClick={() => handleNotificationClick(n)}>
                    {n.message}
                    <span className="notification-date">{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
};

export default Navbar; 