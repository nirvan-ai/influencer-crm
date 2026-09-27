# Influencer CRM — Project Instructions

One-line: creator-side CRM + affiliate-link tracking tool for UGC/product-review Instagram creators. This is the MVP wedge of a larger two-sided marketplace — only the CRM ships in v1. Full spec: `docs/product-spec.md`.

## Stack
- Next.js (full-stack, single repo)
- Postgres via Supabase or Neon
- Auth: Supabase Auth or Clerk
- Hosting: Vercel

## Build & test
<!-- fill in once the repo has real commands, e.g. `npm run dev`, `npm test`, `npm run lint` -->

## Conventions
<!-- fill in as they're decided: file layout, naming, folder structure -->

## Product spec
Read `docs/product-spec.md` before implementing any new entity or feature — it has the data model, the v1 feature list, and (importantly) what's explicitly out of scope. Don't re-derive scope from conversation; the file is the source of truth.

## Do not (v1 scope guardrails)
- No brand-side accounts/login — brands are records the creator manages
- No matching/clustering/discovery algorithm — needs the v1 dataset to exist first
- No real payment processing — track money, don't move it
- No multi-platform support — Instagram only
- No "see what similar accounts are doing" feature — needs multiple creators on-platform first
- No tax/legal features

These are deferred by design, not forgotten. If a task seems to need one of them, stop and flag it rather than building around the gap.
