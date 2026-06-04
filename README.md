# Hermes OS

> Executive Operating System — the single pane of glass for Joey's life, work, projects, and AI workforce.

## Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, shadcn/ui, Tailwind CSS
- **Database:** Firebase Firestore
- **Auth:** Firebase Authentication (Email/Password)
- **Deployment:** Render

## Local Development

```bash
# Install dependencies
npm install

# Add Firebase credentials to .env.local
cp .env.local.example .env.local
# Fill in all NEXT_PUBLIC_FIREBASE_* values

# Start dev server
npm run dev
# → http://localhost:3000
```

## Environment Variables

```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/        # Login page
│   └── (dashboard)/         # Protected dashboard routes
│       ├── page.tsx         # Home / Executive Dashboard
│       ├── projects/        # Portfolio management
│       ├── standup/         # Daily standup loop
│       ├── agents/          # Agent workforce
│       ├── knowledge/       # Knowledge system
│       ├── reviews/         # Executive reviews
│       └── settings/        # Settings
├── components/
│   ├── auth/                # ProtectedRoute
│   ├── layout/              # Sidebar, TopBar
│   └── standup/             # Standup flow components
├── contexts/
│   └── AuthContext.tsx      # Firebase auth context
└── lib/
    ├── firebase/            # Firestore service layer
    │   ├── config.ts
    │   ├── projects.ts
    │   ├── tasks.ts
    │   ├── agents.ts
    │   ├── standup.ts
    │   ├── timeline.ts
    │   └── recommendations.ts
    └── types/               # Shared TypeScript types
        └── index.ts
```

## Daily Standup Loop

Alfred (Hermes Agent) nudges Joey in Discord 3x daily with deep links into the standup page:

| Time | Type | Cron Job ID |
|------|------|-------------|
| 7:00 AM ET | Morning standup | f6fc791cdec9 |
| 12:00 PM ET | Midday check-in | 05daf3d31088 |
| 6:00 PM ET | Evening closeout | e3922097e8e7 |

Update the standup URL in each cron job after deploying to Render.

## Priority Tiers

| Tier | Label | Examples |
|------|-------|---------|
| 1 | Day Job | EA Program |
| 2 | Revenue Generating | Club Report, Insure Connect |
| 3 | Infrastructure | ATLAS, Hermes, Petri |
| 4 | Incubation | Shopicorn, new ideas |

## Deployment

Deploy to Render via `render.yaml` (coming in Week 3). Set all env vars in the Render dashboard.

## Phase Roadmap

- **Phase 1 Week 1** ✅ Foundation + Daily Standup Loop
- **Phase 1 Week 2** — Executive Dashboard + Portfolio
- **Phase 1 Week 3** — Project Detail Pages + Render Deployment
- **Phase 2** — Obsidian sync, health scoring, weekly reviews
- **Phase 3** — Calendar intelligence, knowledge graph, capacity planning
