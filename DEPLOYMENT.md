# 🚀 Deployment Guide

This guide covers multiple deployment options for your Feedback System project.

## 📋 Prerequisites

- Docker and Docker Compose (for containerized deployment)
- Node.js 18+ (for direct deployment)
- Python 3.10+ (for direct deployment)
- Git (for version control)

## 🐳 Option 1: Docker Compose (Recommended)

### Quick Start
```bash
# Clone the repository
git clone <your-repo-url>
cd feedback-system

# Run the deployment script
./deploy.sh
```

### Manual Docker Compose Deployment
```bash
# Build and start services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## ☁️ Option 2: Cloud Deployment

### A. Railway (Recommended for beginners)

1. **Sign up** at [railway.app](https://railway.app)
2. **Connect your GitHub repository**
3. **Deploy both services**:
   - Backend: Set build command to `pip install -r requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Frontend: Set build command to `npm install && npm run build`
4. **Set environment variables**:
   ```
   SECRET_KEY=your-secret-key
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   DATABASE_URL=sqlite:///./feedback_system.db
   ```

### B. Render

1. **Sign up** at [render.com](https://render.com)
2. **Create two services**:
   - **Backend Service**:
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Frontend Service**:
     - Build Command: `npm install && npm run build`
     - Start Command: `npm run preview`

### C. Heroku

1. **Install Heroku CLI**
2. **Create Heroku apps**:
   ```bash
   # Backend
   heroku create your-feedback-backend
   heroku git:remote -a your-feedback-backend
   git subtree push --prefix backend heroku main
   
   # Frontend
   heroku create your-feedback-frontend
   heroku git:remote -a your-feedback-frontend
   git subtree push --prefix frontend heroku main
   ```

### D. DigitalOcean App Platform

1. **Sign up** at [digitalocean.com](https://digitalocean.com)
2. **Create app** and connect your repository
3. **Configure services**:
   - Backend: Python service
   - Frontend: Static site service

## 🏠 Option 3: VPS Deployment

### Using Ubuntu/Debian

1. **Set up your VPS** with Ubuntu 20.04+
2. **Install dependencies**:
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose nginx
   ```

3. **Clone and deploy**:
   ```bash
   git clone <your-repo-url>
   cd feedback-system
   ./deploy.sh
   ```

4. **Configure Nginx** (optional, for custom domain):
   ```bash
   sudo nano /etc/nginx/sites-available/feedback-system
   ```

## 🔧 Environment Configuration

### Backend Environment Variables
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-super-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./feedback_system.db
```

### Frontend Environment Variables
Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:8000
```

## 📊 Database Options

### SQLite (Default)
- Good for development and small deployments
- No additional setup required

### PostgreSQL (Production)
1. **Update requirements.txt**:
   ```
   psycopg2-binary
   ```

2. **Update DATABASE_URL**:
   ```
   DATABASE_URL=postgresql://user:password@localhost/dbname
   ```

3. **Update docker-compose.yml**:
   ```yaml
   services:
     postgres:
       image: postgres:13
       environment:
         POSTGRES_DB: feedback_system
         POSTGRES_USER: user
         POSTGRES_PASSWORD: password
       volumes:
         - postgres_data:/var/lib/postgresql/data
   ```

## 🔒 Security Considerations

### Production Checklist
- [ ] Change default SECRET_KEY
- [ ] Use HTTPS (SSL/TLS)
- [ ] Set up proper CORS configuration
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates

### SSL/HTTPS Setup
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 📈 Monitoring and Maintenance

### Health Checks
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Monitor resource usage
docker stats
```

### Backup Strategy
```bash
# Backup database
docker-compose exec backend sqlite3 feedback_system.db ".backup backup.db"

# Backup uploads
tar -czf uploads-backup.tar.gz backend/uploads/
```

## 🚨 Troubleshooting

### Common Issues

1. **Port already in use**:
   ```bash
   # Find process using port
   lsof -i :8000
   # Kill process
   kill -9 <PID>
   ```

2. **Docker build fails**:
   ```bash
   # Clean Docker cache
   docker system prune -a
   # Rebuild
   docker-compose build --no-cache
   ```

3. **Database connection issues**:
   ```bash
   # Check database file permissions
   ls -la backend/feedback_system.db
   # Reset database (WARNING: loses data)
   rm backend/feedback_system.db
   ```

### Log Analysis
```bash
# View real-time logs
docker-compose logs -f

# Search for errors
docker-compose logs | grep ERROR

# Export logs
docker-compose logs > deployment.log
```

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify environment variables
3. Ensure all dependencies are installed
4. Check network connectivity between services

## 🔄 Updates and Maintenance

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up --build -d
```

### Regular Maintenance
- Update dependencies monthly
- Monitor disk space usage
- Review and rotate logs
- Backup data regularly 