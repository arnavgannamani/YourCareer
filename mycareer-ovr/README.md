# Progression - Your Career, Quantified.

A full-stack web application that works like NBA 2K "MyCareer" but for real careers. Upload your resume, get an Overall Rating (OVR 0-99), and track your career progression with market-aware, explainable scoring.

## Features

- **Resume Parsing**: Upload PDF/DOCX resumes with heuristic baseline parser (optional LLM enhancement)
- **OVR Rating**: Deterministic 0-99 career rating based on education, experience, impact, skills, and activity
- **Market Awareness**: Real-time trend adjustments based on role demand, skill scarcity, and compensation momentum
- **Explainability**: Detailed breakdown of factors contributing to your score with natural language explanations
- **Progression Tracking**: Log macro events (offers, promotions) and micro activities (blog posts, GitHub commits, courses)
- **Anti-Gaming**: Daily caps, decay curves, and duplicate detection for fair scoring
- **Privacy-First**: All data user-owned with export/delete capabilities

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: NextAuth.js (Email + Google OAuth)
- **Charts**: Recharts
- **Resume Parsing**: pdf-parse, mammoth (DOCX)
- **Cron Jobs**: node-cron (or Inngest/Vercel Cron in production)

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- (Optional) OpenAI API key for LLM-enhanced parsing

### Installation

1. **Clone and install dependencies**

```bash
cd mycareer-ovr
npm install
```

2. **Set up environment variables**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Random secret for NextAuth (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your app URL (http://localhost:3000 for dev)

Optional:
- `OPENAI_API_KEY`: For LLM-enhanced resume parsing
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: For Google OAuth

3. **Set up database**

```bash
# Push schema to database
npm run db:push

# Seed with demo data
npm run db:seed
```

4. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Users

After seeding, you can view demo profiles:

1. **alex.johnson@example.com** - High school grad (baseline ~55-62 OVR)
2. **sam.chen@example.com** - Tier-1 finance intern (~74-80 OVR)
3. **jordan.smith@example.com** - Investment ops associate, promoted (~76-82 OVR)
4. **casey.williams@example.com** - Dormant user with stale profile (~60-68 OVR with penalty)

## Project Structure

```
mycareer-ovr/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   ├── auth/         # NextAuth
│   │   ├── parse-resume/ # Resume upload & parsing
│   │   ├── rate/         # OVR calculation
│   │   ├── event/        # Progress events
│   │   └── market/       # Market signals
│   ├── dashboard/        # Main dashboard page
│   ├── profile/          # User profile page
│   ├── activity/         # Activity log page
│   └── auth/signin/      # Sign-in page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── ovr-display.tsx   # OVR score display
│   ├── ovr-breakdown.tsx # Factor breakdown
│   ├── recommendations.tsx
│   ├── rating-chart.tsx  # Historical chart
│   └── explanations.tsx  # Explainability UI
├── lib/                   # Core business logic
│   ├── ovr/              # OVR calculation engine
│   ├── parser/           # Resume parser
│   ├── market/           # Market signals adapter
│   ├── tiers/            # Company & school tiering
│   ├── cron/             # Scheduled jobs
│   ├── auth.ts           # NextAuth config
│   └── db.ts             # Prisma client
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed script
├── fixtures/              # Demo user data
└── __tests__/            # Test suite
```

## OVR Calculation Algorithm

The OVR (Overall Rating) is calculated using a weighted deterministic model:

```
OVR = clamp(
  round(
    (BASE + Σ(factor_i × weight_i)) × trendMultiplier × recencyAdjustment
  ),
  0, 99
)
```

### Factors & Weights

| Factor | Weight | Components |
|--------|--------|-----------|
| **Education** | 18% | School tier (1-5), degree level, GPA |
| **Experience** | 28% | Company tier, tenure, role seniority |
| **Impact** | 24% | Quantified achievements, scope, leadership |
| **Skills** | 18% | Count, level, verification, market scarcity |
| **Certifications** | 6% | Count, authority, expiration status |
| **Recent Activity** | 6% | XP from events (90-day window, 21-day half-life decay) |

**Base Score**: 20 (everyone starts here)

### Market Adjustments

- **Trend Multiplier**: 0.90 - 1.10 based on:
  - Role demand index (0-1)
  - Compensation momentum (-1 to +1)
  
- **Recency Adjustment**: 0.90 - 1.00
  - No penalty for profiles updated in last 6 months
  - -2% per month penalty after 6 months (max -10%)

### Confidence Score (0-1)

```
confidence = 0.5 
  + 0.1 × dataCompleteness 
  + 0.2 × verificationRatio 
  + 0.1 × proofRatio 
  - 0.1 × dateInconsistencies
```

## Tuning the Model

### Adjusting Weights

Edit `lib/ovr/calculator.ts`:

```typescript
const WEIGHTS = {
  education: 0.18,      // Increase for education-heavy roles
  experience: 0.28,     // Increase for experience-driven careers
  impact: 0.24,         // Emphasize measurable achievements
  skills: 0.18,         // Boost for technical roles
  certifications: 0.06, // Raise for cert-heavy industries
  microEvents: 0.06,    // Adjust XP contribution
};
```

Weights must sum to 1.0 or be proportionally scaled.

### Company & School Tiers

Add entries to:
- `lib/tiers/company.ts` - Add companies with tier 1-5
- `lib/tiers/school.ts` - Add schools with tier 1-5

### XP Event Values

Edit `app/api/event/route.ts`:

```typescript
const EVENT_VALUES: Record<string, number> = {
  internship_offer: 12,      // Major career milestone
  fulltime_offer: 15,        // Significant advancement
  promotion: 10,
  blog_post: 1.5,            // Micro activity
  github_commit: 0.2,        // Very small, capped
  // ... add custom event types
};
```

### Market Signal Tuning

Adjust multiplier calculation in `lib/market/adapter.ts`:

```typescript
export function calculateTrendMultiplier(signal: MarketSignalData): number {
  const demandComponent = 0.15 * (signal.demandIdx - 0.5);  // ±7.5% max
  const momentumComponent = 0.10 * signal.compMomentum;     // ±10% max
  
  const adjustment = demandComponent + momentumComponent;
  return 1.0 + clamp(adjustment, -0.10, 0.10);  // Total ±10%
}
```

## Market Signal Integration

### Mock Provider (Default)

Returns stable, plausible market indices based on role/industry heuristics.

### Real Data Provider

To integrate real market data:

1. Create adapter in `lib/market/adapter.ts`:

```typescript
export class RealMarketProvider implements MarketDataProvider {
  async fetchSignals(roleFamily, industry, geo?) {
    // TODO: Call external API (LinkedIn, Indeed, Levels.fyi, etc.)
    const response = await fetch(`https://api.example.com/market-data?role=${roleFamily}`);
    const data = await response.json();
    
    return {
      roleFamily,
      industry,
      geo,
      date: new Date(),
      demandIdx: data.demand,
      skillScarcity: data.skills,
      compMomentum: data.momentum,
    };
  }
}
```

2. Update provider selection in `getMarketProvider()` based on env vars.

### Cron Job

Market signals are refreshed daily at 2 AM (configurable):

```bash
# Run manually
npm run db:seed  # Seeds initial signals

# Or start scheduler (development)
npx tsx lib/cron/scheduler.ts
```

**Production**: Use Vercel Cron, GitHub Actions, or Inngest for reliability.

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

### Test Files

- `__tests__/ovr-calculator.test.ts` - OVR logic with fixture snapshots
- `__tests__/tiers.test.ts` - Company/school tier scoring

### Snapshot Testing

Fixture-based snapshot tests ensure score stability:

```typescript
// When updating the model, run:
npm test -- -u  // Update snapshots

// Scores must not drift >±2 points without explicit version bump
```

## API Reference

### POST `/api/parse-resume`

Upload and parse resume.

**Request**: `multipart/form-data`
- `file`: Resume (PDF/DOCX, max 10MB)
- `useLLM`: "true" | "false" (optional)

**Response**:
```json
{
  "parsed": {
    "education": [...],
    "experiences": [...],
    "skills": [...],
    "certifications": [...]
  },
  "parser": "heuristic" | "llm"
}
```

### POST `/api/user/confirm-profile`

Save parsed resume data to user profile.

**Request**: JSON with education, experiences, skills, certifications

### POST `/api/rate`

Calculate OVR for current user.

**Response**:
```json
{
  "overall": 78,
  "confidence": 0.72,
  "breakdown": [...],
  "explanations": [...],
  "recommendations": [...]
}
```

### GET `/api/me/ratings`

Get rating history for sparkline charts.

### POST `/api/event`

Log a progress event (macro/micro).

**Request**:
```json
{
  "type": "blog_post",
  "metadata": { "title": "..." },
  "proofUrl": "https://...",
  "value": 1.5
}
```

### GET `/api/market/signals`

Get current market signals for user's target role/industry.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

Set up Vercel Cron for daily market sync:
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/market-sync",
    "schedule": "0 2 * * *"
  }]
}
```

### Other Platforms

Works on any Node.js hosting with PostgreSQL:
- Railway
- Render
- Fly.io
- AWS/GCP/Azure

## Roadmap & Extensions

### Nice-to-Haves

1. **Browser Extension**: One-click import job descriptions, get "fit score"
2. **Cohort Percentiles**: "You're in the top 15% of Investment Ops roles"
3. **Career Archetypes**: Identify patterns (e.g., "Quant Track", "Ops-to-Product")
4. **CSV Export**: Download rating history
5. **Team/Company Plans**: Manager dashboards for talent development
6. **Mobile App**: React Native or PWA
7. **Integration APIs**: 
   - LinkedIn profile import
   - GitHub contribution sync
   - LeetCode/Kaggle auto-tracking

### Model Improvements

- **Machine Learning**: Train on actual hiring outcomes to refine weights
- **Industry-Specific Models**: Custom factor weights per industry
- **Peer Comparison**: Relative scoring within role/seniority cohorts
- **Skill Endorsements**: Third-party verification (GitHub, StackOverflow, certifying bodies)

## Privacy & Security

- All user data encrypted at rest and in transit
- GDPR/CCPA compliant with export/delete
- LLM usage is opt-in only
- PII redaction in logs
- Resume files stored in S3-compatible storage with signed URLs

## License

MIT License - See LICENSE file

## Support

For issues, questions, or contributions:
- GitHub Issues: [repo-url]/issues
- Email: support@mycareer-ovr.com
- Documentation: [docs-url]

## Acknowledgments

Built with modern web technologies and inspired by gaming progression systems.

---

**Version**: 1.0.0  
**Model Version**: v1.0  
**Last Updated**: January 2025

