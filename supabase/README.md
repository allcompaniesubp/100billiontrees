# Supabase — 200 Billion Trees

## Connected project

The application is connected to the existing Supabase Free project used by the owner. Do not create a second project or enable paid services without explicit approval.

- Supabase project ref: `xuglowoqhbdngripaojk`
- Region: `ap-southeast-1` (Singapore)
- PostgreSQL: 17
- Plan: Free
- Authentication: email/password with email confirmation, Google OAuth and GitHub OAuth
- Private Storage bucket: `community-media`

The project URL and browser-safe publishable key are configured in Vercel environment variables. Never place a service-role/secret key in source code, browser code, Git history or a public environment variable.

## Database objects

The application schema includes:

- `profiles`
- `countries`
- `tree_species`
- `planting_projects`
- `planting_events`
- `monitoring_checks`
- `certificates`
- `audit_events`
- `community_posts`

Row-level security is enabled on these application tables. New member profiles default to the member role and pending approval. Client-side profile updates cannot grant privileged roles or self-approve membership. Internal trigger functions have restricted execution privileges.

The private `community-media` bucket accepts JPEG, PNG, WebP, MP4 and WebM files up to 50 MB. Uploads require an approved member profile and consent confirmation. New posts remain pending moderation; approved posts are read through short-lived signed URLs. Administrative moderation requires a trusted JWT `app_metadata` role; users must never be able to assign that role to themselves.

## Applied migration history

The connected database currently records these migrations as applied:

- `20261108110315` — initial 200 Billion Trees schema
- `20261108110329` — moderated community media storage
- `20261108110348` — restrict internal RLS event-trigger function
- `20261108110359` — tighten profile trigger and add foreign-key indexes
- `20261108110604` — member profiles and moderation controls
- `20261108110845` — optimize community moderation RLS policies

**Migration reconciliation is still required.** The SQL files currently checked into `supabase/migrations/` do not yet form an exact, ordered mirror of the applied migration history. Do not assume the checked-in files can safely bootstrap a fresh project or replay against the connected database. Before merging schema work, reconcile the repository migrations with the actual applied SQL, review the resulting diff and verify migration status. Do not re-run old setup SQL against the live project.

## Application environment

Configure these variables in the hosting provider, for Preview, Development and Production as required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Only the project URL and publishable key belong in browser code. Keep database passwords, service-role keys and any secret keys private and out of Git.

## Operational safeguards

- Keep email confirmation enabled.
- Do not trust user-editable `user_metadata` for authorization.
- Do not expose private community media with public bucket access.
- Do not issue certificates until a verified record, authorised signatory, unique identifier, revocation process and live verification endpoint exist.
- Do not publish planting or survival totals until evidence and methodology are reviewed.
- Donations, payments, CSR claims and foreign contributions are not enabled. The Foundation's reported 12A/80G approvals still require documentary verification; CSR-1 and FCRA status are unconfirmed.
- Review Supabase security/performance advisors after schema or policy changes.

## Free-tier restriction

Use the Free plan only. Do not activate paid compute, add-ons, custom SMTP, paid storage or other paid services without explicit owner approval. Free-tier quotas and inactivity-pause rules may apply.
