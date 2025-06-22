# 🚀 Deploy to Railway (Live Website)

Railway is perfect for beginners and offers a free tier. Your app will be live at `https://your-app-name.railway.app`

## Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Create a `railway.json` file** in your root directory:
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS"
     },
     "deploy": {
       "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
       "restartPolicyType": "ON_FAILURE",
       "restartPolicyMaxRetries": 10
     }
   }
   ```

## Step 2: Deploy Backend

1. **Go to [railway.app](https://railway.app)** and sign up with GitHub
2. **Click "New Project"** → "Deploy from GitHub repo"
3. **Select your repository**
4. **Choose the `backend` directory** as the source
5. **Set environment variables**:
   - `SECRET_KEY`: Generate a random string (use: `openssl rand -hex 32`)
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `30`
   - `DATABASE_URL`: Leave empty (Railway will create one)
6. **Deploy!** Your backend will be live at `https://your-backend-name.railway.app`

## Step 3: Deploy Frontend

1. **Create another Railway project** for the frontend
2. **Select the `frontend` directory**
3. **Set environment variables**:
   - `VITE_API_URL`: Your backend URL (e.g., `https://your-backend-name.railway.app`)
4. **Deploy!** Your frontend will be live at `https://your-frontend-name.railway.app`

## Step 4: Test Your Live Website

- **Frontend**: `https://your-frontend-name.railway.app`
- **Backend API**: `https://your-backend-name.railway.app`
- **API Docs**: `https://your-backend-name.railway.app/docs`

## 🎉 Congratulations!

Your feedback system is now a live website! Share the frontend URL with your team. 