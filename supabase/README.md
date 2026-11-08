# Supabase setup — 200 Billion Trees

This repository includes an initial PostgreSQL schema at:
`supabase/migrations/202611080001_initial_schema.sql`

## Connection status

The schema is prepared in GitHub, but it has **not** been applied to a Supabase project. No Supabase project, authentication provider, storage bucket, or secret has been configured by this repository change.

## Safe first setup (free tier only)

1. Create or connect the Supabase account and choose the Free plan. Do not enable paid add-ons or upgrade.
2. Create a project named `200-billion-trees` in a region suitable for the organisation and its users. Save the database password privately; never commit it.
3. In the Supabase SQL Editor, review and run the migration file above.
4. In Authentication settings, keep email confirmation enabled. Do not enable Google, Microsoft or Apple sign-in until their provider credentials and redirect URLs are configured.
5. In Project Settings → API, use the project URL and the publishable/anon key only in browser-safe environment variables. Never expose the service-role key in client code or commit any secret.
6. Add the required environment variables to the hosting provider's project settings, not to Git:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or the current Supabase publishable key)
7. Test registration, email confirmation, sign-in, sign-out and row-level access with a non-admin test account before collecting real user data.

## Important safeguards

- Row-level security is enabled on all application tables in the initial migration.
- New profiles default to the `member` role and `pending` approval status.
- Users cannot grant themselves a role or approval through ordinary profile updates.
- Only expert-reviewed tree species and published country profiles are readable publicly.
- A project is public only after its status is approved.
- Planting counts, evidence-reviewed counts and surviving-tree counts must remain separate in public reporting.
- Certificate issuance, public QR verification, media storage, donations and payments are not enabled by this migration.
- Do not collect identity documents, precise site coordinates, children's photographs or other sensitive information until privacy, consent, retention and access controls are designed and tested.

## Free-tier note

Supabase Free has usage and resource limits and may pause inactive projects. Check the current Supabase plan limits before launch. No paid services are authorised for this project.
