# HevyStats

Privacy-first, local web dashboard designed to analyze and extend your historical Hevy workout metrics from a simple CSV export, featuring advanced volume tracking and a customizable BYOK Claude AI coach.

## Why

The free tier of [Hevy](https://www.hevyapp.com/) only shows the last 3 months of history. HevyStats works around that limit by reading the full GDPR data export (`workout_data.csv`) that Hevy provides on request, without ever sending that data to a server.

## How it works

- **100% local-first**: the CSV is parsed in the browser and stored in IndexedDB. Nothing is sent to a backend.
- **Drag & Drop** the CSV export to import the entire history at once.
- **Advanced statistics** on strength and volume (progression, estimated 1RM, per-exercise trends...).
- **BYOK AI chatbot**: the user provides their own Anthropic API key, used only from their browser to query `api.anthropic.com` directly.

## Tech stack

- [React](https://react.dev/) + [Vite](https://vite.dev/) + TypeScript (strict)
- [Dexie.js](https://dexie.org/) (IndexedDB) for local persistence
- [PapaParse](https://www.papaparse.com/) for client-side CSV parsing
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Recharts](https://recharts.org/) for dataviz
- [`@anthropic-ai/sdk`](https://github.com/anthropics/anthropic-sdk-typescript) for the BYOK chatbot integration

## Project structure

```
src/
  components/  reusable UI components
  hooks/       React hooks (DB access, shared state...)
  db/          Dexie.js configuration (IndexedDB schema)
  utils/       utility functions (parsing, calculations, formatting)
  views/       application pages / screens
  types/       shared TypeScript types (Hevy data model)
```

## Development

```bash
npm install
npm run dev
```

## Deployment (GitHub Pages)

```bash
npm run deploy
```

This script builds the app and publishes the `dist/` output to the `gh-pages` branch via [`gh-pages`](https://github.com/tschaub/gh-pages).

## Privacy

- No workout data is ever sent to a HevyStats server (there isn't one).
- The Anthropic API key (BYOK) stays in the user's browser.
- `workout_data.csv` contains real personal data and is intentionally excluded from the repo (`.gitignore`).
