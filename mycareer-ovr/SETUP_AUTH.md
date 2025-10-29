# Auth + Resume Onboarding Setup Guide

This guide covers setting up the complete authentication and onboarding flow, including BERT-based resume parsing.

## Overview

The system now supports:
- ✅ **Google OAuth** sign-in
- ✅ **Email/Password** sign-up and sign-in
- ✅ **Resume Upload** with BERT NER parsing
- ✅ **LinkedIn Profile** URL (placeholder for future implementation)
- ✅ **Onboarding Flow** after first sign-in

## Prerequisites

1. **Node.js 18+**
2. **PostgreSQL** database
3. **Python 3.9+** (for BERT resume parser)
4. **(Optional) Google Cloud Console** account for Google OAuth
5. **(Optional) OpenAI API key** for LLM parsing

## Setup Steps

### 1. Install Node.js Dependencies

```powershell
cd mycareer-ovr
npm install
```

This installs all required packages including:
- `bcryptjs` for password hashing
- `next-auth` for authentication
- `pdf-parse` and `mammoth` for resume parsing

### 2. Update Database Schema

The schema has been updated to include:
- `User.password` for credentials auth
- `User.onboardingComplete` to track onboarding status
- `User.profileComplete` to track profile completeness

Run:

```powershell
npm run db:push
```

Or if you prefer migrations:

```powershell
npm run db:migrate
```

### 3. Set Up Python BERT Service

The BERT service uses the `yashpwr/resume-ner-bert-v2` model for entity extraction.

#### Install Python Dependencies

```powershell
cd python-service

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Note**: First-time installation will download the BERT model (~400MB). This may take a few minutes.

#### Start Python Service

```powershell
# If in python-service directory
python resume_ner.py

# Or use the batch file (Windows)
.\start.bat

# Or from project root
cd python-service && python resume_ner.py
```

The service will run on **http://localhost:5001**

To verify it's working:
```powershell
curl http://localhost:5001/health
```

### 4. Configure Environment Variables

Update your `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mycareer_ovr"

# NextAuth
NEXTAUTH_SECRET="your-secret-from-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Python Service URL (optional, defaults to http://localhost:5001)
PYTHON_SERVICE_URL="http://localhost:5001"

# Google OAuth (optional but recommended)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI (optional, for fallback LLM parsing)
OPENAI_API_KEY="sk-..."
```

#### Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret** to `.env`

### 5. Create Upload Directory

```powershell
mkdir uploads
```

This directory will store uploaded resumes. In production, use cloud storage (S3, Azure Blob, etc.).

### 6. Run the Application

**Terminal 1** - Python BERT Service:
```powershell
cd python-service
python resume_ner.py
```

**Terminal 2** - Next.js App:
```powershell
npm run dev
```

Navigate to **http://localhost:3000**

## User Flow

### New User Sign-Up

1. Visit **http://localhost:3000**
2. Click **"Sign up"** tab
3. Enter email, password, and name
4. Redirected to **/onboarding**
5. Choose onboarding method:
   - **Upload Resume** (PDF/DOCX) - Uses BERT NER parsing
   - **LinkedIn Profile URL** - Placeholder (returns friendly error)
   - **Skip and enter manually** - Go to profile page
6. Review parsed data
7. Confirm and save
8. Redirected to **/dashboard** with OVR calculated

### Existing User Sign-In

1. Visit **http://localhost:3000**
2. Enter email and password (or use Google)
3. Redirected to **/dashboard** (or **/onboarding** if incomplete)

### Google OAuth Sign-In

1. Visit **http://localhost:3000**
2. Click **"Continue with Google"**
3. Authorize with Google
4. Redirected to **/onboarding** (first time) or **/dashboard**

## API Endpoints

### Authentication

- `POST /api/auth/signup` - Create new user with email/password
- `POST /api/auth/[...nextauth]` - NextAuth handlers (signin, signout, etc.)
- `GET /api/auth/[...nextauth]` - NextAuth callbacks

### Resume Parsing

- `POST /api/parse-resume-bert` - Upload and parse resume with BERT
  - Requires: `multipart/form-data` with `file` field
  - Returns: Structured resume data with entities
  
- `POST /api/parse-resume` - Legacy parser (heuristic-based)
  - Fallback if Python service unavailable

- `POST /api/parse-linkedin` - LinkedIn profile URL
  - Returns: 501 Not Implemented with friendly message
  - To implement: Use LinkedIn API, Proxycurl, or web scraping

### Profile Management

- `POST /api/user/confirm-profile` - Save parsed profile data
  - Marks user as `onboardingComplete` and `profileComplete`
  - Creates education, experience, skills, certifications records

### Rating

- `POST /api/rate` - Calculate OVR for current user
- `GET /api/me/ratings` - Get rating history

## Architecture

```
┌─────────────────┐
│   Browser       │
│  (React/Next)   │
└────────┬────────┘
         │
         │ HTTP
         ▼
┌─────────────────┐
│   Next.js API   │
│   (Node.js)     │
└────────┬────────┘
         │
         ├────────► PostgreSQL (User data, profiles)
         │
         └────────► Python Service (BERT NER)
                    (localhost:5001)
```

## Troubleshooting

### Python Service Errors

**Error**: `ModuleNotFoundError: No module named 'transformers'`
- Solution: Activate virtual environment and run `pip install -r requirements.txt`

**Error**: `Model not loading`
- Solution: Check internet connection. First run downloads ~400MB model from HuggingFace

**Error**: `Connection refused on port 5001`
- Solution: Make sure Python service is running: `python resume_ner.py`

### Database Errors

**Error**: `User.password does not exist`
- Solution: Run `npm run db:push` to update schema

**Error**: `Foreign key constraint failed`
- Solution: Clear database and reseed: `npm run db:push -- --force-reset && npm run db:seed`

### Auth Errors

**Error**: `Invalid credentials`
- Solution: Check that Credentials provider is enabled in `lib/auth.ts`

**Error**: `CredentialsSignin`
- Solution: Verify password is hashed correctly and credentials match

**Error**: `Database session error`
- Solution: Check database connection and ensure Session table exists

### File Upload Errors

**Error**: `Cannot find module 'fs/promises'`
- Solution: Use Node.js 14+ which includes fs/promises

**Error**: `ENOENT: no such file or directory, open 'uploads/...'`
- Solution: Create uploads directory: `mkdir uploads`

**Error**: `File size must be less than 10MB`
- Solution: Compress your resume or split into multiple files

## Testing

### Test Resume Upload

1. Prepare a sample resume (PDF or DOCX)
2. Sign up with test account
3. Upload resume on onboarding page
4. Verify entities are extracted correctly
5. Check database for saved records

### Test Python Service

```powershell
# Test health endpoint
curl http://localhost:5001/health

# Test parsing (PowerShell)
$body = @{ text = "John Smith is a software engineer at Google with 5 years experience." } | ConvertTo-Json
Invoke-WebRequest -Uri "http://localhost:5001/parse" -Method POST -Body $body -ContentType "application/json"
```

### Test Auth Flow

```powershell
# Test signup
curl -X POST http://localhost:3000/api/auth/signup `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\",\"password\":\"password123\",\"name\":\"Test User\"}'
```

## Production Deployment

### Next.js App

Deploy to Vercel, Railway, or any Node.js hosting:

1. Set environment variables in hosting platform
2. Ensure `PYTHON_SERVICE_URL` points to deployed Python service
3. Update `NEXTAUTH_URL` to production domain
4. Configure CORS on Python service to allow production domain

### Python BERT Service

Deploy to:

**Option 1: Railway / Render**
- Create new service
- Connect GitHub repo (python-service folder)
- Set start command: `gunicorn -w 4 -b 0.0.0.0:$PORT resume_ner:app`
- Deploy

**Option 2: AWS Lambda / Google Cloud Functions**
- Package dependencies with function
- Set memory to 2GB+ (model is large)
- Configure API Gateway

**Option 3: Docker Container**
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY resume_ner.py .
EXPOSE 5001
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "resume_ner:app"]
```

### File Storage

Replace local file storage with cloud storage:

- **AWS S3**: Use `@aws-sdk/client-s3`
- **Azure Blob**: Use `@azure/storage-blob`
- **Google Cloud Storage**: Use `@google-cloud/storage`
- **Cloudflare R2**: S3-compatible API

Update `app/api/parse-resume-bert/route.ts` to upload files to cloud storage instead of local filesystem.

## Security Considerations

1. **Password Storage**: Passwords are hashed with bcrypt (12 rounds)
2. **File Validation**: Resume uploads limited to 10MB, PDF/DOCX only
3. **Authentication**: NextAuth handles session management securely
4. **CORS**: Python service should restrict CORS to your frontend domain
5. **Rate Limiting**: Consider adding rate limits to signup/upload endpoints
6. **SQL Injection**: Prisma ORM prevents SQL injection by design
7. **XSS Protection**: React escapes output by default

## Future Enhancements

### LinkedIn Integration

To implement LinkedIn profile parsing:

1. **Official API** (Recommended):
   - Register app at [LinkedIn Developer Portal](https://www.linkedin.com/developers/)
   - Implement OAuth flow
   - Use Profile API endpoints
   
2. **Third-Party Service** (Easiest):
   - [Proxycurl](https://nubela.co/proxycurl/) - Paid, reliable
   - [RapidAPI LinkedIn scrapers](https://rapidapi.com/hub)
   
3. **Web Scraping** (Not Recommended):
   - Use Puppeteer/Playwright
   - May violate LinkedIn ToS
   - Requires handling anti-bot measures

### Resume Parsing Improvements

- Train custom NER model on your specific resume format
- Add support for multiple languages
- Extract more entity types (projects, awards, publications)
- Improve company/school tier detection with ML

### Additional Auth Methods

- Microsoft OAuth
- GitHub OAuth
- LinkedIn OAuth (for profile import)
- Magic links (passwordless email)
- Two-factor authentication

## Support

For issues or questions:
- Check existing GitHub issues
- Review test files for usage examples
- Inspect browser network tab for API errors
- Check Python service logs for BERT parsing errors

## Version

- **Auth System**: v1.0
- **BERT Parser**: yashpwr/resume-ner-bert-v2
- **Next.js**: 14.2.3
- **NextAuth**: 4.24.7

