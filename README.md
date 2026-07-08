# Backoffice Agent

## Overview

RE:Agent is an AI assistant for real-estate agency backoffice work. It turns agency data into natural-language answers, charts, drafted emails, and operational reports.

## What it does

- Answer natural-language questions over agency data.
- Generate dashboard-style summaries and charts.
- Draft client or internal emails from structured context.
- Expose task, lead, transaction, and dashboard API routes for the app UI.

## User workflows

- Run the web app, open the dashboard, and ask operational questions about agency data.
- Use generated chart/report outputs for management review.
- Review drafted emails before sending them outside the app.

## Stack

- Next.js app with TypeScript.
- React UI and API routes under `src/app`.
- Agent tool handlers under `src/lib/agent`.
- Project data modules under `src/data`.

## Project structure

- `src/app/` - pages and API routes.
- `src/lib/agent/` - agent tools and handlers.
- `src/data/` - seeded business data.
- `package.json` - scripts and dependencies.

## Setup

- Install Node dependencies with `npm install`.
- Create `.env.local` from the project example if present.
- Start the app with `npm run dev`.

## Common commands

- `npm run dev` - development server.
- `npm run build` - production build.
- `npm run start` - serve built app.
- `npm run lint` - lint checks.

## Configuration and secrets

- `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `GROQ_API_KEY` may be used by AI features depending on the active provider.
- Google OAuth variables are used for Google integrations. Keep all values in `.env.local`, never in docs.

## Data, storage, and integrations

- Local TypeScript data modules provide demo or seed entities.
- Google integrations use OAuth credentials and refresh tokens when enabled.

## Troubleshooting

- If AI answers fail, verify the selected provider key exists in `.env.local`.
- If Google features fail, refresh OAuth credentials and redirect URI configuration.

## Documentation maintenance

Update this README whenever functionality, setup, commands, environment variables, storage, integrations, or user workflows change. Follow the CoS project documentation standard in `../../../docs/project-documentation-standard.md` or `../../docs/project-documentation-standard.md` depending on the project depth. Never include real secret values.
