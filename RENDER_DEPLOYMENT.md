# Render Deployment Guide - ClgBooksAI

## Step 1: Prepare for Render Deployment

### 1.1 Create render.yaml Configuration File

This file tells Render how to build and run your application.

### 1.2 Ensure package.json Scripts are Correct

Your package.json already has the correct scripts.

## Step 2: Deploy to Render

### 2.1 Create a GitHub Repository (Required for Render)

```bash
# If not already on GitHub
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2.2 Go to Render Dashboard

1. Visit: https://render.com
2. Sign up with GitHub account
3. Connect your GitHub repository

### 2.3 Create New Web Service

1. Click "New +" → "Web Service"
2. Select your HiYou repository
3. Configure settings:
   - **Name**: clgbooks-ai (or your choice)
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Free (or Starter)

### 2.4 Add Environment Variables

In Render dashboard, go to Environment variables and add:

```
DATABASE_URL=postgresql://your_database_url
SESSION_SECRET=your_secure_random_string
NODE_ENV=production
```

### 2.5 Add Database

#### Option A: Use Render PostgreSQL (Recommended for Render)
1. In Render, create a PostgreSQL database
2. Copy the connection string
3. Paste in DATABASE_URL environment variable

#### Option B: Use External Database
- **Neon**: https://neon.tech (free tier available)
- **Railway**: https://railway.app
- **AWS RDS**: https://aws.amazon.com/rds

### 2.6 Deploy

1. Click "Create Web Service"
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build the application
   - Start the server
3. View logs to monitor deployment

## Step 3: Database Setup

After deployment, run migrations:

```bash
# SSH into Render service (or use Render Shell)
npm run db:push
```

Or configure this in render.yaml:

```yaml
services:
  - type: web
    name: clgbooks-ai
    env: node
    buildCommand: npm install && npm run build && npm run db:push
    startCommand: npm start
```

## Step 4: Verify Deployment

1. Your app will be live at: `https://clgbooks-ai.onrender.com`
2. Test all features:
   - Signup with email
   - OTP verification
   - Login
   - Dashboard
   - Admin panel
   - Chat bot

## Step 5: Custom Domain (Optional)

1. In Render dashboard
2. Go to settings → Custom Domain
3. Add your domain
4. Follow DNS configuration

---

## Render Pricing

- **Free Tier**: 
  - 750 compute hours/month
  - 100MB storage
  - Auto-sleep after 15 minutes of inactivity
  
- **Starter Plan** ($7/month):
  - Recommended for production
  - No auto-sleep
  - Better performance

---

## Troubleshooting Render Deployment

### Problem: Build fails
**Solution**: 
- Check build logs in Render
- Ensure all environment variables are set
- Verify database URL is correct

### Problem: App crashes after deploy
**Solution**:
- Check logs: Render Dashboard → Logs
- Verify DATABASE_URL is set
- Ensure SESSION_SECRET is set

### Problem: Database migrations fail
**Solution**:
- SSH into service
- Run: `npm run db:push`
- Check database connection

### Problem: Slow startup
**Solution**:
- Upgrade to Starter plan
- Database might be in different region

---

## Next: Render-Specific Configuration Files

See `render.yaml` (if created) for advanced configuration.

---

## Support

- Render Docs: https://render.com/docs
- Contact Render Support: support@render.com
