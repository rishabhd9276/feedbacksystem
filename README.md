# Feedback System

A comprehensive employee feedback management system built with React frontend and FastAPI backend, featuring document uploads, announcements, peer feedback, and more.

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

- **Document Management**
  - PDF document uploads
  - Public/private document visibility
  - Document download functionality
  - File size validation (max 10MB)

- **Announcements**
  - Manager announcements for teams
  - Active/inactive announcement status
  - Team-specific announcements

- **Notifications**
  - Real-time notifications
  - Read/unread status tracking
  - Automatic notifications for various actions

- **Comments System**
  - Comments on feedback
  - Edit and delete functionality
  - Manager notifications for comments

### Additional Features
- **Dashboard Analytics**
  - Manager dashboard with team insights
  - Employee feedback timeline
  - Sentiment trend analysis

- **PDF Export**
  - Export individual feedback as PDF
  - Export all feedback for an employee
  - Professional PDF formatting

## 🛠️ Tech Stack

### Frontend
- **React** - UI framework
- **Axios** - HTTP client
- **CSS** - Styling
- **Vite** - Build tool

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

## 📁 Project Structure

```
feedback-system/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api/            # API configuration
│   │   └── App.jsx         # Main app component
│   ├── package.json
│   └── vite.config.js
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── models.py       # Database models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── crud.py         # Database operations
│   │   ├── main.py         # FastAPI app
│   │   ├── auth.py         # Authentication
│   │   ├── deps.py         # Dependencies
│   │   └── database.py     # Database setup
│   ├── uploads/            # Document storage
│   ├── requirements.txt
│   └── Dockerfile
├── README.md
└── .gitignore
```

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
   # Build Docker image
   docker build -t feedback-backend .
   
   # Run with volume mount for uploads
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

## 📖 API Documentation

Once the backend is running, visit:
- **Interactive API Docs:** http://localhost:8000/docs
- **Alternative API Docs:** http://localhost:8000/redoc

## 🔐 Authentication

The system uses JWT tokens for authentication. Users can register and login through the API endpoints:

- `POST /auth/register` - User registration
- `POST /auth/login` - User login

## 👥 User Roles

### Manager
- Create and manage feedback for team members
- View team analytics and insights
- Create announcements for the team
- View public documents from team members
- Export feedback reports

### Employee
- View and acknowledge received feedback
- Upload and manage documents
- Give peer feedback to team members
- View team announcements
- Add comments to feedback

## 📊 Features in Detail

### Feedback System
- **Manager Feedback:** Managers can provide structured feedback with strengths, areas for improvement, and sentiment analysis
- **Peer Feedback:** Employees can give feedback to their team members
- **Anonymous Options:** Both manager and peer feedback can be anonymous
- **Acknowledgment:** Employees must acknowledge feedback before managers can update it

### Document Management
- **Upload:** Employees can upload PDF documents
- **Visibility:** Documents can be marked as public (visible to manager) or private
- **Download:** Secure document download with proper authorization
- **Storage:** Files are stored in the `uploads/` directory

### Announcements
- **Team-specific:** Managers can create announcements visible only to their team
- **Status Management:** Announcements can be activated/deactivated
- **Notifications:** Team members receive notifications for new announcements

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Rishabh Dubey**
- GitHub: [@rishabhd9276](https://github.com/rishabhd9276)

## 🙏 Acknowledgments

- FastAPI for the excellent web framework
- React for the frontend framework
- SQLAlchemy for the ORM
- All contributors and users of this system

---

**Note:** This is a comprehensive feedback management system designed for modern workplaces. It includes all the essential features needed for effective employee feedback and communication. 