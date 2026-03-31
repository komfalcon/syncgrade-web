# SyncGrade

An interactive web application that helps students calculate their Cumulative Grade Point Average (CGPA) across multiple semesters with an intuitive interface.

## Prerequisites

- [Node.js](https://nodejs.org/) v22.16.0
- npm (comes with Node.js)

## Quick Start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Start the development server
npm run dev
```

Then open **http://localhost:3000** in your browser.

## All Commands

| Command | Description |
|---------|-------------|
| `npm install --legacy-peer-deps` | Install all dependencies |
| `npm run dev` | Start the development server (http://localhost:3000) |
| `npm run build` | Build for production |
| `npm start` | Preview the production build |
| `npm run test` | Run tests |
| `npm run check` | TypeScript type-checking |
| `npm run format` | Format code with Prettier |

## Project Structure

```
├── src/
│   ├── components/  # UI components (Shadcn/Radix)
│   ├── pages/       # Page components
│   ├── hooks/       # Custom React hooks
│   ├── engine/      # CGPA calculation logic
│   └── universities/# University grading configs
├── public/          # Static and PWA assets
├── shared/          # Shared constants
├── index.html
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Shadcn/Radix UI
- **Build:** Vite
- **Routing:** wouter
- **Testing:** Vitest

## Feedback & Sync Worker Setup

Cloudflare Pages should call a Worker for backend APIs.

1. Configure frontend environment variables in Cloudflare Pages:
   - `VITE_STUDENT_SYNC_ENDPOINT=https://<your-worker-domain>/api/student-sync`
   - `VITE_FEEDBACK_ENDPOINT=https://<your-worker-domain>/api/feedback`
2. Ensure your D1 database uses the schema in `sql/schema.sql` so `feedback_messages` exists.
3. Confirm `wrangler.toml` points to `src/worker/index.ts`, where:
   - `POST /api/student-sync` maps to the student sync handler
   - `POST /api/feedback` maps to the feedback insertion handler
