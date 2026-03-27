# SyncGrade

A standalone React PWA that helps students calculate their Cumulative Grade Point Average (CGPA) across multiple semesters with an intuitive interface.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- pnpm (recommended) or npm

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start the development server
pnpm dev
```

Then open **http://localhost:3000** in your browser.

## All Commands

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm dev` | Start the development server (http://localhost:3000) |
| `pnpm build` | Build for production (outputs static assets to `dist/public`) |
| `pnpm preview` | Preview the production build locally |
| `pnpm test` | Run tests |
| `pnpm check` | TypeScript type-checking |
| `pnpm format` | Format code with Prettier |

## Project Structure

```
├── client/          # React/TypeScript frontend (Vite)
│   ├── src/
│   │   ├── components/  # UI components (Shadcn/Radix)
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── engine/      # CGPA calculation logic
│   │   └── universities/# University grading configs
│   └── index.html
├── shared/          # Shared constants
├── package.json
├── vite.config.ts
├── wrangler.toml    # Cloudflare Pages config
└── tsconfig.json
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Shadcn/Radix UI
- **Build:** Vite + vite-plugin-pwa
- **Routing:** wouter
- **Testing:** Vitest

## Environment Variables

Create a `.env` file based on `.env.example`:

- `VITE_OAUTH_PORTAL_URL`
- `VITE_APP_ID`
- `VITE_FRONTEND_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_URL` (optional; defaults in code)
- `VITE_ANALYTICS_ENDPOINT` (optional)
- `VITE_ANALYTICS_WEBSITE_ID` (optional)

## Deploy to Cloudflare Pages

1. Build command: `pnpm build`
2. Output directory: `dist/public`
3. Framework preset: `None` (custom), since Vite handles build directly
4. Configure the same `VITE_*` variables in Cloudflare Pages environment settings

You can also deploy with Wrangler using the included `wrangler.toml`.
