# SyncGrade

An interactive web application that helps students calculate their Cumulative Grade Point Average (CGPA) across multiple semesters with an intuitive interface.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
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
| `npm start` | Run the production server (after building) |
| `npm run test` | Run tests |
| `npm run check` | TypeScript type-checking |
| `npm run format` | Format code with Prettier |

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
├── server/          # Express.js production server
├── shared/          # Shared constants
├── flutter_app/     # Flutter/Dart mobile app (separate)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS, Shadcn/Radix UI
- **Build:** Vite, esbuild
- **Routing:** wouter
- **Testing:** Vitest
