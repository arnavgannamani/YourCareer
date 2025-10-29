# Quick Reference - MyCareer OVR Auth System

## 🚀 Starting the Application

```powershell
# Terminal 1 - Python BERT Service
cd python-service
.\venv\Scripts\activate    # or: .\start.bat
python resume_ner.py

# Terminal 2 - Next.js App
npm run dev
```

Open: **http://localhost:3000**

## 🔑 Key URLs

| URL | Purpose |
|-----|---------|
| http://localhost:3000 | Home (redirects to signin or dashboard) |
| http://localhost:3000/auth/signin | Sign in / Sign up |
| http://localhost:3000/onboarding | Resume upload & profile setup |
| http://localhost:3000/dashboard | Main dashboard with OVR |
| http://localhost:3000/demo | Demo user profiles |
| http://localhost:5001 | Python BERT service |
| http://localhost:5001/health | Health check endpoint |

## 📁 Important Files

### Configuration
- `.env` - Environment variables
- `prisma/schema.prisma` - Database schema
- `package.json` - Node dependencies
- `python-service/requirements.txt` - Python dependencies

### Auth & Onboarding
- `lib/auth.ts` - NextAuth configuration
- `app/api/auth/signup/route.ts` - User registration
- `app/auth/signin/page.tsx` - Login/signup UI
- `app/onboarding/page.tsx` - Onboarding flow
- `app/page.tsx` - Home with redirect logic

### Resume Parsing
- `python-service/resume_ner.py` - BERT NER service
- `app/api/parse-resume-bert/route.ts` - Resume upload API
- `lib/parser/resume-parser.ts` - Heuristic parser (fallback)

## 🗄️ Database Commands

```powershell
# Update schema
npm run db:push

# Create migration
npm run db:migrate

# Seed demo data
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
```

## 🐍 Python Service Commands

```powershell
cd python-service

# Create venv (first time only)
python -m venv venv

# Activate venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run service
python resume_ner.py

# Run with Gunicorn (production)
gunicorn -w 4 -b 0.0.0.0:5001 resume_ner:app
```

## 🧪 Testing Commands

```powershell
# Test Python service health
curl http://localhost:5001/health

# Test BERT parsing
curl -X POST http://localhost:5001/parse `
  -H "Content-Type: application/json" `
  -d '{"text":"John Smith, Software Engineer at Google"}'

# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 📦 Installation Commands

```powershell
# Install Node dependencies
npm install

# Install Python dependencies
cd python-service
pip install -r requirements.txt
```

## 🔧 Common Fixes

### Port 3000 in use
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### Port 5001 in use
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process -Force
```

### Reset database
```powershell
npm run db:push -- --force-reset
npm run db:seed
```

### Reinstall Node modules
```powershell
rm -r node_modules
rm package-lock.json
npm install
```

### Reinstall Python venv
```powershell
cd python-service
rm -r venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

## 📊 User Model Fields

```typescript
User {
  id: string
  email: string
  name?: string
  password?: string              // For credentials auth
  onboardingComplete: boolean    // Has completed onboarding
  profileComplete: boolean       // Has complete profile data
  // ... relations
}
```

## 🎨 Key Components

```typescript
// Check if user needs onboarding
const session = await getServerSession(authOptions);
const user = await prisma.user.findUnique({
  where: { id: session.user.id },
  select: { onboardingComplete: true }
});
if (!user?.onboardingComplete) {
  redirect("/onboarding");
}

// Sign up new user
const hashedPassword = await bcrypt.hash(password, 12);
await prisma.user.create({
  data: { email, password: hashedPassword, name }
});

// Parse resume with BERT
const response = await fetch(`${PYTHON_SERVICE_URL}/parse`, {
  method: "POST",
  body: JSON.stringify({ text: resumeText })
});

// Sign in user
await signIn("credentials", { email, password });
await signIn("google", { callbackUrl: "/" });
```

## 🌐 Environment Variables

```env
# Required
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="generate-with-openssl"
NEXTAUTH_URL="http://localhost:3000"

# Optional
PYTHON_SERVICE_URL="http://localhost:5001"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
OPENAI_API_KEY="sk-..."
```

## 📚 Dependencies Added

```json
{
  "bcryptjs": "^2.4.3",           // Password hashing
  "@types/bcryptjs": "^2.4.6"     // TypeScript types
}
```

## 🔐 Auth Providers

1. **Google OAuth** - `signIn("google")`
2. **Email/Password** - `signIn("credentials", { email, password })`
3. **Magic Link** - `signIn("email", { email })` (requires SMTP)

## 🎯 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Python service not starting | Activate venv: `.\venv\Scripts\activate` |
| Resume parsing fails | Check Python service: http://localhost:5001/health |
| Can't sign in | Check DATABASE_URL and run `npm run db:push` |
| Build errors | Run `npm install` and `npx prisma generate` |
| Type errors | Restart TypeScript server in VS Code |
| Port conflicts | Kill process or use different port |

## 📖 Documentation

- **Full Setup**: `SETUP_AUTH.md`
- **Windows Guide**: `WINDOWS_QUICKSTART.md`
- **Implementation Details**: `AUTH_IMPLEMENTATION_SUMMARY.md`
- **Project Overview**: `README.md`

## 🚨 Production Checklist

- [ ] Set strong `NEXTAUTH_SECRET`
- [ ] Configure Google OAuth with production URL
- [ ] Deploy Python service separately
- [ ] Use cloud file storage (S3)
- [ ] Enable rate limiting
- [ ] Add monitoring/logging
- [ ] Set up backup strategy
- [ ] Configure CORS properly
- [ ] Use HTTPS everywhere
- [ ] Set up CI/CD pipeline

## 💡 Pro Tips

1. Keep Python service running in separate terminal
2. Use `npm run db:studio` to inspect database visually
3. Check browser console for client-side errors
4. Check terminal for server-side errors
5. Test with real resumes for accuracy
6. Clear browser cache if session issues occur
7. Use incognito for testing different users

## 🆘 Getting Help

1. Check error messages carefully
2. Verify all services are running
3. Check environment variables
4. Review relevant documentation
5. Test individual components (Python service, DB, etc.)

---

**Quick Start**: `WINDOWS_QUICKSTART.md`
**Need Help?** Check the error in PowerShell/Browser Console

