# Product Spec — Creator CRM + Affiliate Tracking (v1)

_Source of truth for this repo. If this ever conflicts with something said in chat, this file wins — update it, don't just remember the exception._

Scope: creator-only tool (no brand login yet). Target user: UGC/product-review Instagram creators.

## Data model

**Creator** — id, handle, platform (instagram for v1), niche tags, follower count (manual entry v1), bio, created_at.

**Brand** — lightweight record the creator adds manually, not a platform account yet. id, name, website, contact info, category/niche tags, created_by (creator_id).

**Deal** — the core CRM object. id, creator_id, brand_id, status (lead → pitched → negotiating → agreed → content_live → invoiced → paid → closed_lost), deal_type (gifted / paid / affiliate / hybrid), agreed_amount, currency, deliverables (structured list, e.g. "1 reel + 2 stories"), content_deadline, notes, created_at, updated_at.

**Activity** — follow-up/timeline log. id, deal_id, event_type (status_change / note / reminder), text, remind_at (nullable), created_at.

**Invoice** — id, deal_id, invoice_number, line_items (json), amount, due_date, status (draft / sent / paid / overdue), pdf_url.

**AffiliateLink** — id, creator_id, brand_id (nullable), destination_url, slug (short code), created_at.

**Click** — id, affiliate_link_id, timestamp, referrer (minimal — no invasive tracking), converted (bool, manually confirmed until a real affiliate network integration exists).

**Payout** — id, creator_id, source_type (deal / affiliate_link), source_id, amount, status (pending / paid), date.

## v1 feature list (build in this order)

1. Auth + creator profile
2. Deal pipeline (kanban-style board across the status stages above) — the core CRM, dogfoodable at this point
3. Activity log + follow-up reminders (a "needs attention" dashboard view is enough for v1 — no push/email infra needed yet)
4. Ask/pitch template library — pre-written templates insertable into deal notes or copyable as text
5. Affiliate link generation + redirect + click counting
6. Invoicing — generate from a deal, track sent/paid/overdue
7. Dashboard rollup — active deals, overdue follow-ups, this month's earnings, outstanding invoices

## Explicitly out of scope for v1

- Brand-side accounts/login
- Matching/clustering/discovery algorithm (needs this dataset to exist first)
- Automated payments/payment processing
- Multi-platform (YouTube Shorts, etc.)
- "See what similar accounts are doing" competitive intelligence
- Taxes/legal support

## Status
Drafted 2026-09-26. Update this file (not just the chat) whenever scope actually changes.
