# Windows Quick Start Guide

## Prerequisites Checklist

- [ ] Node.js 18+ installed ([download](https://nodejs.org/))
- [ ] Python 3.9+ installed ([download](https://www.python.org/downloads/))
- [ ] PostgreSQL OR a cloud database account (Neon/Supabase)
- [ ] Git installed (comes with Windows now)

## Step-by-Step Setup (Windows)

### 1. Database Setup (Choose One)

#### Option A: Cloud Database (Easiest - No Local Install)

**Neon.tech** (Recommended):
1. Go to https://neon.tech
2. Sign up (free, no credit card)
3. Create new project
4. Copy connection string (looks like: `postgresql://user:pass@host.region.aws.neon.tech:5432/dbname`)

**Supabase**:
1. Go to https://supabase.com
2. Create project
3. Go to Settings > Database
4. Copy connection string

#### Option B: Local PostgreSQL

1. Download from https://www.postgresql.org/download/windows/
2. Run installer (remember your password!)
3. Open PowerShell and create database:
```powershell
# Add PostgreSQL to your PATH or navigate to bin folder
psql -U postgres
# Enter password when prompted
CREATE DATABASE mycareer_ovr;
\q
```

Your connection string: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/mycareer_ovr`

### 2. Clone/Open Project

```powershell
cd "C:\Users\arnav\OneDrive\Pictures\Camera Roll\Desktop\Desktop\projects\mycareer-ovr"
```

### 3. Install Node Dependencies

```powershell
npm install
```

This takes 2-3 minutes. Grab a coffee ☕

### 4. Set Up Environment File

Create `.env` file in the project root:

```powershell
# Create file
New-Item .env -ItemType File

# Open in Notepad
notepad .env
```

Paste this and update with your values:

```env
# Database (use your connection string from step 1)
DATABASE_URL="postgresql://user:password@host:5432/mycareer_ovr"

# NextAuth Secret (generate below)
NEXTAUTH_SECRET="paste-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Python Service (leave as-is for now)
PYTHON_SERVICE_URL="http://localhost:5001"

# Google OAuth (optional - skip for now)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

**Generate NEXTAUTH_SECRET**:

```powershell
# Run this in PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and paste it as `NEXTAUTH_SECRET` in `.env`

Save and close Notepad.

### 5. Initialize Database

```powershell
npm run db:push
```

This creates all tables. Should take 10-20 seconds.

### 6. Set Up Python BERT Service

Open a **second PowerShell window**:

```powershell
cd "C:\Users\arnav\OneDrive\Pictures\Camera Roll\Desktop\Desktop\projects\mycareer-ovr\python-service"

# Option 1: Use the batch file (easier)
.\start.bat

# Option 2: Manual setup
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python resume_ner.py
```

**First Run Note**: Downloads ~400MB BERT model from HuggingFace. Takes 5-10 minutes depending on internet speed.

You should see:
```
 * Running on http://127.0.0.1:5001
```

**Keep this window open!** The service needs to run while using the app.

### 7. Start Next.js App

Back in your **first PowerShell window**:

```powershell
npm run dev
```

You should see:
```
  ▲ Next.js 14.2.3
  - Local:        http://localhost:3000
```

### 8. Open Browser

Go to: http://localhost:3000

## Testing the Setup

### Create Your First Account

1. Click **"Don't have an account? Sign up"**
2. Enter:
   - Name: Your Name
   - Email: test@example.com
   - Password: password123 (min 8 chars)
3. Click **"Create Account"**

### Upload a Resume

1. You'll be redirected to onboarding
2. Click **"Upload Resume"**
3. Choose a PDF or DOCX resume
4. Wait 5-10 seconds for BERT parsing
5. Review extracted information
6. Click **"Confirm & Continue"**

### See Your OVR

You'll be redirected to the dashboard with your career rating!

## Common Issues

### Python Service Won't Start

**Error**: `python: command not found`
- **Fix**: Make sure Python is installed and in your PATH
- **Check**: Run `python --version` in PowerShell
- **Install**: Download from https://www.python.org/downloads/
  - ⚠️ Check "Add Python to PATH" during install

**Error**: `ModuleNotFoundError: No module named 'flask'`
- **Fix**: Make sure you activated the virtual environment
```powershell
cd python-service
.\venv\Scripts\activate
pip install -r requirements.txt
```

**Error**: `Address already in use: 5001`
- **Fix**: Another service is using port 5001
```powershell
# Find and kill process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process -Force
```

### Database Connection Failed

**Error**: `Can't reach database server`
- **Fix**: Check your `DATABASE_URL` in `.env`
- **Test connection**: Try connecting with pgAdmin or `psql`

**If using local PostgreSQL**:
```powershell
# Check if PostgreSQL is running
Get-Service -Name postgresql*
# If not running:
Start-Service postgresql-x64-14  # (version may differ)
```

**If using Neon/Supabase**:
- Verify you copied the full connection string
- Check for typos in `.env`
- Make sure `?sslmode=require` is at the end if required

### Port 3000 Already in Use

**Error**: `Port 3000 is already in use`
- **Fix Option 1**: Kill the process
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```
- **Fix Option 2**: Use a different port
```powershell
$env:PORT=3001; npm run dev
```

### Resume Upload Fails

**Error**: `Resume parsing service unavailable`
- **Cause**: Python service not running
- **Fix**: Make sure the Python service is running on port 5001
- **Test**: Open http://localhost:5001/health in browser

**Error**: `Could not extract sufficient text`
- **Cause**: Resume is mostly images or scanned PDF
- **Fix**: Use a text-based PDF or DOCX file
- **Alternative**: Click "Skip and enter manually"

### Cannot Sign In

**Error**: `Invalid credentials`
- **Double-check**: Email and password are correct
- **Note**: Email is case-sensitive
- **Try**: Sign up again with a different email

**Error**: `Database error`
- **Fix**: Make sure you ran `npm run db:push`
- **Check**: Database is running and accessible

## Development Workflow

When working on the project:

1. **Start Python Service** (if not running):
```powershell
# Terminal 1
cd python-service
.\venv\Scripts\activate
python resume_ner.py
```

2. **Start Next.js**:
```powershell
# Terminal 2
npm run dev
```

3. **Make changes** - Hot reload is enabled
4. **Test** in browser

## Optional: Google Sign-In Setup

1. Go to https://console.cloud.google.com
2. Create project or select existing
3. Enable "Google+ API"
4. Credentials → Create Credentials → OAuth 2.0 Client ID
5. Type: Web application
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Secret to `.env`:
```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```
8. Restart `npm run dev`

## Next Steps

✅ You're all set up! Now you can:

- Upload different resumes to test parsing
- Try Google sign-in (if configured)
- Check out the dashboard
- View the demo profiles: http://localhost:3000/demo
- Calculate your OVR

## Need Help?

- Check `SETUP_AUTH.md` for detailed documentation
- Check `README.md` for project overview
- Review error logs in PowerShell windows
- Test Python service: http://localhost:5001/health

## Stopping the Services

When you're done:

1. **Stop Next.js**: Press `Ctrl+C` in terminal running `npm run dev`
2. **Stop Python**: Press `Ctrl+C` in terminal running `python resume_ner.py`
3. **Deactivate Python venv**: Type `deactivate` in PowerShell

## Starting Again

Next time you work on the project:

```powershell
# Terminal 1 - Python service
cd python-service
.\venv\Scripts\activate
python resume_ner.py

# Terminal 2 - Next.js
npm run dev
```

That's it! 🚀

