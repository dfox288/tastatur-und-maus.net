# tastatur-und-maus.net

Public website for Tastatur und Maus e.V. — the non-profit that organises Revision, the Easter demoparty in Saarbrücken. Bilingual (EN/DE).

## Stack
- Astro v6, Tailwind CSS v4, TypeScript
- Content in Markdown via Astro content collections (`src/content/`)
- Deployed via Docker + nginx to self-hosted k8s

## Scripts
- `npm run dev` — Astro dev server
- `npm run build` — static build to `dist/`
- `npm run preview` — preview the built site
- `npm run test` — Vitest unit tests (i18n helpers)
- `npm run test:e2e` — Playwright smoke
- `npm run typecheck` — Astro + TS checks
- `npm run fetch:unsplash` — re-download placeholder images
- `npm run migrate:content` — rebuild content MD from design handoff

## Architecture
See `docs/superpowers/specs/2026-04-18-tum-website-design.md` for the v1 design decisions. Follow-ups in `docs/TODO.md`.

## Deployment
Pushes to `main` build `dfox288/tastatur-und-maus:${SHA}` on Docker Hub, then bump the image tag in the `dfox288/tum-cluster-tum-websites_k8s` manifest repo. ArgoCD reconciles the change.
