# 🌐 Deploy to Render (Live Website)

Render offers a generous free tier and is very beginner-friendly. Your app will be live at `https://your-app-name.onrender.com`

## Step 1: Prepare Your Repository

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for Render deployment"
   git push origin main
   ```

2. **Create a `render.yaml` file** in your root directory:
   ```yaml
   services:
     - type: web
       name: feedback-backend
       env: python
       buildCommand: pip install -r requirements.txt
       startCommand: uvicorn app.main:app --host 0.0.0.0 --port $PORT
       rootDir: backend
       envVars:
         - key: SECRET_KEY
           generateValue: true
         - key: ACCESS_TOKEN_EXPIRE_MINUTES
           value: 30
   
     - type: web
       name: feedback-frontend
       env: static
       buildCommand: npm install && npm run build
       staticPublishPath: ./dist
       rootDir: frontend
       envVars:
         - key: VITE_API_URL
           value: https://your-backend-name.onrender.com
   ```

## Step 2: Deploy Backend

1. **Go to [render.com](https://render.com)** and sign up with GitHub
2. **Click "New +"** → "Web Service"
3. **Connect your GitHub repository**
4. **Configure the service**:
   - **Name**: `feedback-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. **Set environment variables**:
   - `SECRET_KEY`: Click "Generate" to auto-generate
   - `ACCESS_TOKEN_EXPIRE_MINUTES`: `30`
6. **Click "Create Web Service"**

## Step 3: Deploy Frontend

1. **Click "New +"** → "Static Site"
2. **Connect the same GitHub repository**
3. **Configure the service**:
   - **Name**: `feedback-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Set environment variable**:
   - `VITE_API_URL`: Your backend URL (e.g., `https://feedback-backend.onrender.com`)
5. **Click "Create Static Site"**

## Step 4: Test Your Live Website

- **Frontend**: `https://feedback-frontend.onrender.com`
- **Backend API**: `https://feedback-backend.onrender.com`
- **API Docs**: `https://feedback-backend.onrender.com/docs`

## 🎉 Congratulations!

Your feedback system is now a live website! Share the frontend URL with your team.

## 💡 Tips

- **Custom Domain**: You can add a custom domain in Render settings
- **Auto-Deploy**: Render automatically redeploys when you push to GitHub
- **Free Tier**: Includes 750 hours/month of runtime
- **Scaling**: Easy to upgrade to paid plans for more resources 