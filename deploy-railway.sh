#!/bin/bash

echo "🌐 Deploying Feedback System to Railway (Live Website)..."

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    exit 1
fi

# Check if remote origin exists
if ! git remote get-url origin &> /dev/null; then
    echo "❌ No GitHub remote found. Please add your GitHub repository:"
    echo "   git remote add origin https://github.com/yourusername/your-repo-name.git"
    exit 1
fi

# Generate a secure secret key
SECRET_KEY=$(openssl rand -hex 32)
echo "🔑 Generated SECRET_KEY: $SECRET_KEY"

echo ""
echo "🚀 Ready to deploy! Follow these steps:"
echo ""
echo "1. 📤 Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Ready for Railway deployment'"
echo "   git push origin main"
echo ""
echo "2. 🌐 Go to https://railway.app and sign up with GitHub"
echo ""
echo "3. 🔧 Deploy Backend:"
echo "   - Click 'New Project' → 'Deploy from GitHub repo'"
echo "   - Select your repository"
echo "   - Choose 'backend' directory as source"
echo "   - Set environment variables:"
echo "     SECRET_KEY=$SECRET_KEY"
echo "     ACCESS_TOKEN_EXPIRE_MINUTES=30"
echo ""
echo "4. 🎨 Deploy Frontend:"
echo "   - Create another Railway project"
echo "   - Select 'frontend' directory"
echo "   - Set environment variable:"
echo "     VITE_API_URL=https://your-backend-name.railway.app"
echo ""
echo "5. 🎉 Your website will be live at:"
echo "   Frontend: https://your-frontend-name.railway.app"
echo "   Backend: https://your-backend-name.railway.app"
echo ""
echo "📋 Alternative: Use Render.com (also free):"
echo "   - Go to https://render.com"
echo "   - Similar process but with different UI" 