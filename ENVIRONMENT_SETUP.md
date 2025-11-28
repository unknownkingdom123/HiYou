# Environment Setup Guide

## Local Development Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Environment File
Create `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/clgbooks

# JWT Secret (Change this to a strong secret in production)
SESSION_SECRET=your-super-secret-key-change-in-production

# Server Port
PORT=5000

# Environment
NODE_ENV=development
```

### Step 3: Database Setup
```bash
npm run db:push
```

### Step 4: Run Development Server
```bash
npm run dev
```

Server will start at: `http://localhost:5000`

---

## Production Setup

### Step 1: Environment Variables
Create `.env` with production values:

```env
# Production Database (e.g., from Railway, Neon, or your provider)
DATABASE_URL=postgresql://prod_user:strong_password@prod_host:5432/clgbooks_prod

# Strong JWT Secret
SESSION_SECRET=generate-a-strong-random-string-here

# Port
PORT=5000

# Environment
NODE_ENV=production
```

### Step 2: Build
```bash
npm run build
```

### Step 3: Database Migrations
```bash
npm run db:push
```

### Step 4: Start Production Server
```bash
npm start
```

---

## Default Admin Credentials

**For Testing Only - Change Immediately in Production**

- **Username (MIS NO.)**: `Avishkar`
- **Password**: `Avishkar2007`

---

## Database Options

### Option 1: PostgreSQL Local
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/clgbooks
```

### Option 2: Neon (Recommended for Cloud)
1. Go to https://neon.tech
2. Create new project
3. Copy connection string to `.env`
```env
DATABASE_URL=postgresql://user:password@ep-xxxxx.neon.tech/clgbooks
```

### Option 3: Railway
1. Create PostgreSQL database on Railway
2. Copy connection string
```env
DATABASE_URL=postgresql://user:password@gateway.railway.app:5432/clgbooks
```

### Option 4: AWS RDS
1. Create RDS PostgreSQL instance
2. Set security groups for access
```env
DATABASE_URL=postgresql://admin:password@clgbooks.xxxxx.us-east-1.rds.amazonaws.com:5432/clgbooks
```

---

## Deployment to Different Platforms

### Replit (Already Configured)
- `.replit` file is configured
- Just set `.env` variables
- Click "Run" button

### Vercel + Railway
1. **Backend (Railway)**
   - Push to GitHub
   - Connect Railway to GitHub repo
   - Set environment variables
   - Deploy

2. **Frontend (Vercel)**
   - Configure build command: `npm run build`
   - Set environment variables
   - Deploy

### DigitalOcean App Platform
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy

### Fly.io
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login

# Initialize
flyctl launch

# Set secrets
flyctl secrets set DATABASE_URL=...
flyctl secrets set SESSION_SECRET=...

# Deploy
flyctl deploy
```

### Docker Deployment
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string |
| `SESSION_SECRET` | ✅ Yes | - | JWT signing secret |
| `PORT` | ❌ No | 5000 | Server port |
| `NODE_ENV` | ❌ No | development | Environment mode |

---

## Troubleshooting

### "Cannot find type definition file for 'node'"
- Run: `npm install`

### "DATABASE_URL not set"
- Create `.env` file with `DATABASE_URL` value

### "Port already in use"
- Change `PORT` in `.env` or kill process on port 5000

### "Database connection failed"
- Verify `DATABASE_URL` is correct
- Check network connectivity
- Ensure firewall allows connections

### "OTP emails not received"
- In production, implement SMS/Email service (e.g., Twilio, SendGrid)
- Currently logs to console in development

---

## Production Checklist

- [ ] Change default admin password
- [ ] Set strong `SESSION_SECRET`
- [ ] Use production database (not local)
- [ ] Setup HTTPS (via reverse proxy like Nginx)
- [ ] Setup backups for database
- [ ] Configure monitoring/logging
- [ ] Setup rate limiting
- [ ] Implement real OTP delivery
- [ ] Setup file storage backup
- [ ] Enable CORS for specific domains only
- [ ] Setup error tracking (Sentry, etc.)

---

## Support

For issues, check:
1. `.env` file is in root directory
2. All required variables are set
3. Database is accessible
4. Node.js version is 16+
5. Port 5000 is available

