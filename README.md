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

## See also

- [`tum-cluster-tum-websites_k8s`](https://github.com/dfox288/tum-cluster-tum-websites_k8s) — runtime manifests (Argo CD app `tum-websites`, namespace `tum-tum`). The deploy step lands here.
- [`tum-cluster_k8s`](https://github.com/dfox288/tum-cluster_k8s) — platform layer (cluster fundamentals, ingress, certs, storage, GitOps).
- [`tum-static-websites`](https://github.com/dfox288/tum-static-websites) — historical tum-party.net year archives (1999–2013).
- [`revision-static-websites`](https://github.com/dfox288/revision-static-websites) — Revision year archives (2011–2024), the demoparty that Tastatur und Maus e.V. organises.
- [`archive.revision-party.net`](https://github.com/dfox288/archive.revision-party.net) — richer interactive archive of Revision history.
