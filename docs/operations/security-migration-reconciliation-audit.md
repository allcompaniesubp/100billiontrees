# Production security and migration reconciliation audit

Audit date: 2026-11-10

Repository: allcompaniesubp/100billiontrees  
Production project: Supabase `xuglowoqhbdngripaojk` (Free tier, ap-southeast-1)  
Production application: https://200billiontrees.unspuniversity.com

## Scope and safety

This work is a read-only production audit plus a documentation-only repository update. The exact SQL already applied in production has been recovered and archived. No SQL was applied during this work. No production schema, RLS policy, grant, storage object, Auth setting, environment variable, secret, or user record was changed.

## Exact production migration snapshot

The production migration ledger contains 14 applied migrations. The exact SQL payloads were read from `supabase_migrations.schema_migrations` and archived under `docs/operations/production-migration-snapshot/`:

| Version | Name |
|---|---|
| `20261108110315` | `initial_200_billion_trees_schema` |
| `20261108110329` | `community_media_moderated_storage` |
| `20261108110348` | `restrict_internal_rls_event_trigger_function` |
| `20261108110359` | `tighten_profile_trigger_and_add_fk_indexes` |
| `20261108110604` | `create_member_profiles_and_moderation_controls` |
| `20261108110845` | `optimize_community_moderation_rls_policies` |
| `20261109052831` | `member_uploads_and_private_messaging` |
| `20261109054644` | `tree_registry_certificate_admin` |
| `20261109121316` | `projects_and_tree_survival_monitoring` |
| `20261109121547` | `tighten_project_submission_and_staff_review_access` |
| `20261109121602` | `add_survival_log_review_status` |
| `20261109121741` | `consolidate_project_review_policies_and_indexes` |
| `20261109121811` | `restrict_public_project_fields_and_split_read_policies` |
| `20261109122044` | `capture_land_type_and_require_approved_monitoring_reporters` |

**Verification: 14/14 files match the corresponding production ledger `statements` payload exactly**, including the initial schema and the previously missing project-submission tightening migration.

These files are a forensic snapshot, deliberately outside `supabase/migrations/`. They must not be copied into the active migration directory, renamed as new pending migrations, or replayed against production. The migration versions are already recorded as applied.

## Comparison with the active repository migrations

The active `supabase/migrations/` directory contains nine files with a different version sequence. A direct comparison against the production snapshot found:

- Seven of the nine source files match their corresponding production SQL after removing comments and normalizing whitespace.
- The checked-in initial schema (`202611080001_initial_schema.sql`) differs substantively from the SQL applied as `20261108110315`.
- The checked-in project/survival migration (`202611090003_projects_and_survival_monitoring.sql`) differs substantively from the SQL applied as `20261109121316`.
- The two checked-in land-type files (`202611090006` and `202611090008`) are semantically equivalent after comment/whitespace normalization; the later file matches the production SQL in normalized form.

Therefore, the existing active migration directory is **not a safe fresh-bootstrap sequence**. Do not run `supabase db push` from it against production or assume it recreates the production schema. A separate migration-history design is required for clean development environments.

## Security advisor findings

1. `public.audit_events` has RLS enabled and no policies. This is deny-by-default for ordinary API roles and may be intentional for an internal audit table. Confirm trusted server-side write and any intended administrator read path. Do not add a broad authenticated policy.
2. Supabase leaked-password protection is disabled. Evaluate enabling it in Auth password security settings after reviewing impact on existing signup and password-change flows. It was not changed.

## Verified profile RLS

The live `public.profiles` table has:
- INSERT: `profiles_insert_own`, requiring `id = auth.uid()`.
- SELECT: `profiles_select_admin_directory`, requiring `private.is_staff()`.
- SELECT: `profiles_select_own`, requiring `id = auth.uid()`.
- UPDATE: `profiles_update_own`, requiring `id = auth.uid()` in both `USING` and `WITH CHECK`.

The performance advisor flags the two permissive SELECT policies. Their OR semantics appear consistent with own-profile access plus staff directory access; do not remove either without reviewing the application and helper function.

## Performance advisor findings

Five foreign keys were reported without covering indexes:
- `support_messages.sender_id`
- `tree_registry.created_by`
- `tree_registry.planting_event_id`
- `tree_registry.reviewed_by`
- `tree_registry.species_id`

The advisor also reported 24 unused indexes and one multiple-permissive-policy notice on profiles. Do not delete indexes solely because they are currently unused; this is a new project and infrequent workflows may not yet have exercised them.

## Project and survival RLS snapshot

Read-only inspection confirmed the live project/survival tables contain the expected project fields, including `land_ownership_type`, `reviewed_by`, `reviewed_at`, and the survival-log `review_status`. Relevant checks and foreign keys are present.

Observed access model:
- `planting_projects`: approved-member insert with review fields controlled by the server; authenticated reads for approved projects, owner, or staff; anonymous reads only for approved projects; owner edits limited to drafts, with staff review separately allowed.
- `tree_survival_logs`: inserts require an approved reporter associated with the tree/project and pending review state; reads are limited to reporter, project owner, or staff; updates are staff-only.

This is a schema/policy snapshot, not an end-to-end authorization test with separate member and staff identities.

## Safe next steps

1. Preserve the production migration snapshot as the source of truth for the currently applied history.
2. Design a clean, separate development migration baseline without rewriting or replaying the production history.
3. Test fresh bootstrap and app workflows against an isolated PostgreSQL environment before proposing schema changes.
4. Review the `audit_events` writer and reader paths; retain deny-by-default unless a documented admin use case requires a controlled policy.
5. Test profile self-read/update and staff-directory access using separate member/staff sessions.
6. Review the five foreign-key index candidates with query plans and real access patterns before adding indexes.
7. Evaluate leaked-password protection separately and test signup/password-change behavior.
8. Run security/performance advisors and end-to-end tests for registration, login, tree registration, project submissions, survival reporting, moderation, messaging, and certificate verification.

## Deployment record

The documentation-only archive was merged to `main` in commit `f1e5b1c41f0eeee26773ad0700a113841d359298`. The final audit branch preview build completed successfully. The production deployment for the merge was triggered automatically by Vercel. This merge does not change application code or behavior.

No production database migration or security-setting change was part of this deployment.
