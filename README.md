# Feedback System

A comprehensive employee feedback management system built with a modern React (Material-UI) frontend and FastAPI backend, featuring document uploads, announcements, assignments, peer feedback, real-time notifications, and more.

---

## 🆕 What's New (2024)
- **Modern Material-UI Frontend:** All dashboards and forms use Material-UI for a clean, responsive, and professional look.
- **Notification Popover with Dismiss:** Notification bell opens a popover with a list of notifications. Each notification can be individually dismissed (with an X), keeping the list tidy.
- **Assignment Management:**
  - Managers can upload assignments (with title, description, due date, and file).
  - Employees are notified, can view assignments, and submit their work.
  - Submission upload and tracking for each assignment.
- **Assignment Comments:**
  - Transparent comment section for each assignment (employees and managers can discuss, ask questions, and get notified of new comments).
- **Toast Notifications:** All user actions (upload, submit, comment, errors) use toast notifications for instant feedback.
- **Backend Dockerfile Fix:** Docker image now installs all dependencies correctly (no more missing 'click' or other packages).

---

## 🚀 Features

### Core Features
- **User Authentication & Authorization**
  - Manager and Employee roles
  - JWT-based authentication
  - Role-based access control

- **Feedback Management**
  - Manager-to-employee feedback
  - Peer feedback between team members
  - Anonymous feedback options
  - Feedback acknowledgment system
  - Sentiment analysis tracking

- **Assignment Management**
  - Managers upload assignments (with file, title, description, due date)
  - Employees receive notifications and can submit their work
  - Submission tracking and file upload
  - Comment section for assignment discussion

- **Document Management**
  - PDF/document uploads
  - Public/private document visibility
  - Document download functionality
  - File size validation (max 10MB)

- **Announcements**
  - Manager announcements for teams
  - Active/inactive announcement status
  - Team-specific announcements

- **Notifications**
  - Real-time notifications for all major actions
  - Notification popover with dismiss (X) for each notification
  - Read/unread status tracking
  - Automatic notifications for assignments, submissions, comments, announcements, and more

- **Comments System**
  - Comments on feedback and assignments
  - Edit and delete functionality
  - Manager and employee notifications for new comments

### Additional Features
- **Dashboard Analytics**
  - Manager dashboard with team insights
  - Employee feedback timeline
  - Sentiment trend analysis

- **PDF Export**
  - Export individual feedback as PDF
  - Export all feedback for an employee
  - Professional PDF formatting

- **Modern UI/UX**
  - Material-UI components for all forms, lists, and navigation
  - Toast notifications for all user actions
  - Responsive and accessible design

---

## 🛠️ Tech Stack

### Frontend
- **React** + **Material-UI** (MUI)
- **Axios** - HTTP client
- **Vite** - Build tool
- **react-toastify** - Toast notifications

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM
- **SQLite** - Database
- **JWT** - Authentication
- **Pydantic** - Data validation
- **Uvicorn** - ASGI server

### DevOps
- **Docker** - Containerization
- **Git** - Version control

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Python 3.10+
- Docker (optional)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```
2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Run with Docker (Recommended):**
   ```bash
   docker build -t feedback-backend .
   docker run -p 8000:8000 -v "$(pwd)/uploads:/app/uploads" feedback-backend
   ```
4. **Or run directly:**
   ```bash
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Start development server:**
   ```bash
   npm run dev
   ```
4. **Open in browser:**
   ```
   http://localhost:5173
   ```

---

## 📖 API Documentation

Once the backend is running, visit:
- **Interactive API Docs:** http://localhost:8000/docs
- **Alternative API Docs:** http://localhost:8000/redoc

---

## 👥 User Roles & Permissions

### Manager
- Create/manage feedback for team members
- Upload assignments and view submissions
- View team analytics and insights
- Create announcements for the team
- View public documents from team members
- Export feedback reports
- Participate in assignment comment discussions

### Employee
- View and acknowledge received feedback
- Upload and manage documents
- Give peer feedback to team members
- View team announcements
- View and submit assignments
- Add comments to assignments and feedback

---

## 📊 Features in Detail

### Feedback System
- **Manager Feedback:** Structured feedback with strengths, areas for improvement, and sentiment analysis
- **Peer Feedback:** Employees can give feedback to their team members
- **Anonymous Options:** Both manager and peer feedback can be anonymous
- **Acknowledgment:** Employees must acknowledge feedback before managers can update it

### Assignment Management
- **Upload:** Managers upload assignments with file, title, description, and due date
- **Submission:** Employees submit work for assignments (with file and description)
- **Comments:** Transparent comment section for assignment discussion
- **Notifications:** Real-time notifications for new assignments, submissions, and comments

### Document Management
- **Upload:** Employees can upload PDF/documents
- **Visibility:** Documents can be marked as public (visible to manager) or private
- **Download:** Secure document download with proper authorization
- **Storage:** Files are stored in the `uploads/` directory

### Announcements
- **Team-specific:** Managers can create announcements visible only to their team
- **Status Management:** Announcements can be activated/deactivated
- **Notifications:** Team members receive notifications for new announcements

### Notifications
- **Popover UI:** Notification bell opens a popover with a list of notifications
- **Dismiss:** Each notification can be individually dismissed (X)
- **Read/Unread:** Read/unread status is tracked and updated
- **Toast Feedback:** All actions (upload, submit, comment, errors) use toast notifications for instant feedback

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./feedback_system.db
```

### Database
The system uses SQLite by default. The database file is created automatically on first run.

---

## 🐳 Docker Deployment

### Backend
```bash
cd backend
docker build -t feedback-backend .
docker run -p 8000:8000 -v "$(pwd)/uploads:/app/uploads" feedback-backend
```

### Frontend
```bash
cd frontend
docker build -t feedback-frontend .
docker run -p 3000:3000 feedback-frontend
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

---

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Rishabh Dubey**
- GitHub: [@rishabhd9276](https://github.com/rishabhd9276)

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- React for the frontend framework
- SQLAlchemy for the ORM
- Material-UI for the modern UI components
- All contributors and users of this system

---

**Note:** This is a comprehensive feedback management system designed for modern workplaces. It includes all the essential features needed for effective employee feedback, assignment management, and communication. 