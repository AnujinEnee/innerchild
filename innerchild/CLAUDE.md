# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server**: `npm run dev`
- **Build**: `npm run build`
- **Start production**: `npm start`
- **Lint**: `npm run lint`

No test framework is configured yet.

## Architecture

This is a Next.js 16 app (App Router) with React 19, TypeScript 5, and Tailwind CSS v4.

- **`app/`** — App Router directory. `layout.tsx` is the root layout; `page.tsx` is the home route. All components are server components by default.
- **`public/`** — Static assets served at `/`.
- **Path alias**: `@/*` maps to the project root (configured in tsconfig.json).
- **Styling**: Tailwind CSS v4 via PostCSS (no tailwind.config — uses v4 defaults). Global theme variables (--background, --foreground) are defined in `app/globals.css`. Dark mode uses `prefers-color-scheme` media queries.
- **Fonts**: Geist Sans and Geist Mono loaded via `next/font/google`, exposed as CSS variables.
- **ESLint**: Flat config (v9) extending `next/core-web-vitals` and `next/typescript`.
