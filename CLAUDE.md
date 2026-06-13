# hermes-os — Claude Code Project Memory

## What This Is
Hermes OS — a personal operating system dashboard. Next.js app deployed on Vercel with Firebase backend.
Production URL: https://hermes-os-two.vercel.app

## Stack
- **Next.js** (latest — BREAKING CHANGES from older versions, read `node_modules/next/dist/docs/` before writing any Next.js code)
- **TypeScript** with strict mode
- **Tailwind CSS** + **shadcn/ui** + **Radix UI** components
- **Firebase** (Firestore for data, Auth for user management)
- **Vercel** — auto-deploys on every push to master

## Project Structure
```
src/
  app/              # Next.js App Router pages and layouts
  contexts/         # React contexts (AuthContext, etc.)
  hooks/            # Custom React hooks
  lib/              # Utilities (utils.ts, etc.)
components.json     # shadcn/ui config
firebase.json       # Firebase project config
vercel.json         # Vercel deployment config
```

## Key Commands
```bash
npm run dev     # Dev server — localhost:3000
npm run build   # Production build — MUST pass before any task is "done"
npm run lint    # ESLint — run before every commit
npm run start   # Serve production build locally
```

## Critical Rules — READ FIRST
1. **NEVER regress Calendar or Fitness** — these are the two fully working features. Any change must leave them intact.
2. **NEVER move tailwindcss or @tailwindcss/postcss to devDependencies** — Vercel build will fail. They must stay in `dependencies`.
3. **NEVER commit service-account.json** — it's a Firebase service account with real credentials.
4. **NEVER commit .env.local** — contains Firebase project secrets.
5. **NEXT_PUBLIC_ prefix** — only use for values safe to expose to the browser.

## Vercel Environment Variables
All 8 env vars are set in Vercel dashboard (NEXT_PUBLIC_FIREBASE_* + FIREBASE_SERVICE_ACCOUNT_KEY). Do not add new required env vars without noting them here.

## Code Conventions
- 2-space indentation for TypeScript/TSX
- Explicit return types on all exported functions and components
- `const` over `let` wherever possible
- shadcn/ui components for all new UI — check `src/` before building custom components
- Firebase operations via the existing context patterns in `src/contexts/`

## Finance Module (existing)
Pages: `/finance`, `/bills`, `/subscriptions`
Bills and Subscriptions are nested under Finance in the sidebar.
Data source: SimpleFIN (~90 day history). Self-hosted Rocket Money replacement.

## Alfred Integration
- Completed tasks → `hermes send --to discord "<summary>"`
- Build failures → `hermes send --to discord "🔴 hermes-os build failed: <error>"`
- Do NOT git push without explicit instruction from Joey
