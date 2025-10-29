# Setup Guide - MyCareer OVR

## Step-by-Step Setup

### 1. Prerequisites

Ensure you have:
- Node.js 18+ installed
- PostgreSQL database (local or cloud like Supabase, Neon, Railway)
- Git

### 2. Clone/Navigate to Project

```bash
cd mycareer-ovr
```

### 3. Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, Prisma, NextAuth, and UI libraries.

### 4. Database Setup

#### Option A: Local PostgreSQL

```bash
# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql

# Create database
createdb mycareer_ovr
```

Your DATABASE_URL will be:
```
postgresql://localhost:5432/mycareer_ovr
```

#### Option B: Cloud Database (Recommended for Easy Setup)

**Neon.tech** (Free tier, no credit card):
1. Go to https://neon.tech
2. Sign up and create a new project
3. Copy the connection string

**Supabase** (Free tier):
1. Go to https://supabase.com
2. Create project
3. Get connection string from Settings > Database

**Railway** (Free tier):
1. Go to https://railway.app
2. Create PostgreSQL database
3. Copy connection string

### 5. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database - REQUIRED
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# NextAuth - REQUIRED
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Email provider (for passwordless auth)
EMAIL_SERVER_HOST=""
EMAIL_SERVER_PORT=""
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""
EMAIL_FROM=""

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional: OpenAI for LLM resume parsing
OPENAI_API_KEY=""
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 6. Initialize Database

Push the Prisma schema to your database:

```bash
npm run db:push
```

This creates all tables defined in `prisma/schema.prisma`.

### 7. Seed Demo Data

Load 4 fixture users with calculated OVR scores:

```bash
npm run db:seed
```

This creates:
- **alex.johnson@example.com** - High school grad
- **sam.chen@example.com** - Tier-1 finance intern  
- **jordan.smith@example.com** - Investment ops associate
- **casey.williams@example.com** - Dormant user

### 8. Start Development Server

```bash
npm run dev
```

Open http://localhost:3000

### 9. View Demo Dashboards

Navigate to:
- http://localhost:3000/demo - See all demo users
- http://localhost:3000/demo/[userId] - Individual user dashboard

To find user IDs, check the seed output or query the database:
```bash
npm run db:studio
```

### 10. Test the Application

Run tests:
```bash
npm test
```

## Google OAuth Setup (Optional)

To enable "Sign in with Google":

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: "Web application"
6. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://yourdomain.com/api/auth/callback/google` (prod)
7. Copy Client ID and Client Secret to `.env`

## Troubleshooting

### Database Connection Errors

```
Error: Can't reach database server at `localhost:5432`
```

**Solutions:**
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL format
- Try cloud database (Neon, Supabase)

### Prisma Generate Errors

```
Error: Generator "client" failed
```

**Solution:**
```bash
rm -rf node_modules/.prisma
npm run postinstall
```

### Port Already in Use

```
Error: Port 3000 is already in use
```

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Missing Dependencies

```
Module not found: Can't resolve '@radix-ui/...'
```

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables (same as `.env`)
4. Deploy

Vercel automatically:
- Builds Next.js app
- Runs `prisma generate`
- Handles serverless functions

### Railway

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add PostgreSQL: `railway add postgresql`
5. Deploy: `railway up`

### Environment Variables for Production

Update `.env` or hosting platform:
- `NEXTAUTH_URL` → Your production domain
- `DATABASE_URL` → Production database
- `NEXTAUTH_SECRET` → Different from dev (more secure)

## Next Steps

1. **Customize OVR Weights**: Edit `lib/ovr/calculator.ts`
2. **Add Companies/Schools**: Update `lib/tiers/`
3. **Integrate Real Market Data**: Replace mock provider in `lib/market/adapter.ts`
4. **Set Up Cron Jobs**: Use Vercel Cron or external scheduler
5. **Configure Email**: Set up SMTP or use SendGrid/Resend

## Support

- Check README.md for full documentation
- Review test files for usage examples
- Inspect seed data in `fixtures/` for data format

---

**Quick Start One-Liner:**
```bash
npm install && npm run db:push && npm run db:seed && npm run dev
```

