# Production security and migration reconciliation audit

Audit date: 2026-11-10

Repository: allcompaniesubp/100billiontrees
Production base commit: 486c456803b0c4f3dba764c2b1ae1ab1e8b185db
Supabase project: xuglowoqhbdngripaojk (Free, ap-southeast-1)

## Scope and safety

This is a read-only audit record. No production SQL, auth settings, storage settings, environment variables, secrets, or user records were changed. No migration was applied. The work branch is isolated from main. Do not merge or deploy until the items below are resolved and reviewed.

## Migration history discrepancy

The connected database reports 14 applied migrations:

- 20261108110315 initial_200_billion_trees_schema
- 20261108110329 community_media_moderated_storage
- 20261108110348 restrict_internal_rls_event_trigger_function
- 20261108110359 tighten_profile_trigger_and_add_fk_indexes
- 20261108110604 create_member_profiles_and_moderation_controls
- 20261108110845 optimize_community_moderation_rls_policies
- 20261109052831 member_uploads_and_private_messaging
- 20261109054644 tree_registry_certificate_admin
- 20261109121316 projects_and_tree_survival_monitoring
- 20261109121547 tighten_project_submission_and_staff_review_access
- 20261109121602 add_survival_log_review_status
- 20261109121741 consolidate_project_review_policies_and_indexes
- 20261109121811 restrict_public_project_fields_and_split_read_policies
- 20261109122044 capture_land_type_and_require_approved_monitoring_reporters

The repository currently contains nine SQL migration files. These do not form a complete, verified ordered mirror of the 14 applied migrations. The migration SQL for all applied versions must be recovered from trusted source/history and reconciled against the live schema before any migration replay, fresh-project bootstrap, or schema change. Do not run the checked-in migration directory against production as-is.

## Security advisor findings

1. INFO: public.audit_events has RLS enabled and no policies. This currently blocks ordinary API roles from reading/writing through RLS, which may be intentional for an append-only internal audit table. Verify how trusted server-side code writes events and whether an administrator read path is required. Do not add a broad authenticated policy.
2. WARN: Supabase leaked-password protection is disabled. Plan to enable it in Auth password security settings after checking user impact and the current Supabase guidance. This Auth configuration change was not made during this audit.

## Verified RLS policies

The live public.profiles table currently has:
- INSERT: profiles_insert_own, requiring id = auth.uid()
- SELECT: profiles_select_admin_directory, requiring private.is_staff()
- SELECT: profiles_select_own, requiring id = auth.uid()
- UPDATE: profiles_update_own, requiring id = auth.uid() in both USING and WITH CHECK

The advisor flags the two permissive SELECT policies as a performance notice. Their OR semantics appear consistent with own-profile access plus staff directory access; do not remove either without reviewing application behavior and policy helper definitions.

## Performance advisor findings

Five foreign keys were reported without covering indexes:
- support_messages.sender_id
- tree_registry.created_by
- tree_registry.planting_event_id
- tree_registry.reviewed_by
- tree_registry.species_id

The advisor also reported 24 unused indexes and one multiple-permissive-policy warning on profiles. Unused-index notices alone are not grounds for deletion; the project may be new and indexes may support future or infrequent queries.

## Safe remediation sequence

1. Recover the exact SQL for all 14 applied migration versions from trusted migration artifacts or deployment history.
2. Compare the recovered SQL and live schema; document any drift. Preserve all user data and existing objects.
3. Build a clean, complete migration history on an isolated development database/branch and verify a fresh bootstrap.
4. Review audit_events writer/reader paths and confirm the intended deny-by-default access model.
5. Test profile self-read/update and staff-directory access against the current RLS semantics.
6. Review the five foreign-key index candidates against query plans and expected access patterns before adding indexes.
7. Evaluate enabling leaked-password protection and test signup/password-change behavior.
8. Run application tests, production build, Supabase security/performance advisors, and end-to-end auth/project/tree workflows.
9. Submit a reviewed PR. Production migrations and deployment require separate explicit approval.

## Verification performed

- Supabase migration inventory queried read-only.
- Supabase security and performance advisors queried read-only.
- pg_policies inspected for public.profiles and public.audit_events.
- information_schema inspected for public.audit_events columns.
- No production mutation performed.

## Follow-up: migration source recovery (2026-11-10)

GitHub commit diffs provide source SQL for the project/survival-monitoring migration family. The recovered repository files are:

- `202611090003_projects_and_survival_monitoring.sql` (introduced in commit `000e0f0`; later included in the project-management feature history).
- `202611090004_survival_review_state.sql` (introduced in commit `8881f5d`).
- `202611090005_consolidate_project_review_policies.sql` (introduced in commit `0220d86`).
- `202611090006_land_type_and_approved_monitoring_reporters.sql` (introduced in commit `a33175c`, and amended in commit `1ee1f91`).
- `202611090007_restrict_public_project_fields.sql` (introduced in commit `e2d8fb1`).
- `202611090008_land_type_and_approved_monitoring_reporters.sql` (introduced in commit `9698172`).

These source files cover the same broad project/survival feature sequence as several later production migration records, but their filename versions do not match the production migration versions. They are evidence of source history, not proof that each file is byte-for-byte identical to the SQL applied in production.

Two reconciliation blockers are now explicit:

1. The production record `20261109121547 tighten_project_submission_and_staff_review_access` has not yet been matched to a corresponding committed SQL artifact. Do not infer or recreate its SQL from the migration name.
2. The repository contains both `202611090006` and `202611090008` land-type/approved-reporter migration files. Their SQL is substantially overlapping; the later file is not a safe substitute for determining exactly which SQL was applied under production record `20261109122044`. Compare complete file contents and live schema before deciding whether one is redundant or represents an intentional correction.

The first eight production migration records also still require a verified one-to-one source mapping. The recovered project-family files do not resolve that earlier history.

No SQL was applied during this follow-up. The audit remains read-only and the production database remains unchanged.

## Follow-up: live project/survival schema snapshot (read-only)

The production schema currently contains the project and monitoring fields expected by the current application, including `land_ownership_type`, `land_permission_status`, `reviewed_by`, `reviewed_at`, and the survival-log `review_status` field. The expected date, positive tree-target, land-type, survival milestone/status, evidence-path, GPS-range, and reviewer foreign-key constraints are present.

Current policies observed:

- `planting_projects`: own approved-member insert with server-controlled review fields; authenticated read for approved projects, owner, or staff; anonymous read only for approved projects; owner update restricted to draft rows or staff.
- `tree_survival_logs`: insert limited to an approved profile reporting for an owned/created eligible tree, with pending review and reviewer fields unset; read for reporter, project owner, or staff; update limited to staff.

These live policy expressions are a useful target for comparison, but do not prove the full applied migration text or migration order. The production schema currently contains the intended project/survival feature objects; the migration-history/source mismatch remains unresolved.

No production data, policies, grants, schema, or Auth configuration was changed during this check.

## Follow-up: expanded migration provenance map

GitHub history confirms these source-file candidates:

| Production migration record | Repository source candidate | Reconciliation status |
|---|---|---|
| `20261108110315 initial_200_billion_trees_schema` | `202611080001_initial_schema.sql` | Base source found, but the file was subsequently amended (including profile-trigger and certificate-view changes); the exact SQL at production-apply time is not yet proven |
| `20261108110329 community_media_moderated_storage` | — | Source artifact not found |
| `20261108110348 restrict_internal_rls_event_trigger_function` | — | Source artifact not found |
| `20261108110359 tighten_profile_trigger_and_add_fk_indexes` | — | No separately verified production-version artifact found; later edits to the initial schema are not sufficient proof |
| `20261108110604 create_member_profiles_and_moderation_controls` | — | Source artifact not found |
| `20261108110845 optimize_community_moderation_rls_policies` | — | Source artifact not found |
| `20261109052831 member_uploads_and_private_messaging` | `202611090001_member_uploads_and_private_messaging.sql` | Source file found; compare exact production-applied text before declaring byte-identical |
| `20261109054644 tree_registry_certificate_admin` | `202611090002_tree_registry_certificate_admin.sql` | Source file found; compare exact production-applied text before declaring byte-identical |
| `20261109121316 projects_and_tree_survival_monitoring` | `202611090003_projects_and_survival_monitoring.sql` | Source file found; timestamp differs |
| `20261109121547 tighten_project_submission_and_staff_review_access` | — | Source artifact not found |
| `20261109121602 add_survival_log_review_status` | `202611090004_survival_review_state.sql` | Source file found; timestamp differs |
| `20261109121741 consolidate_project_review_policies_and_indexes` | `202611090005_consolidate_project_review_policies.sql` | Source file found; timestamp differs |
| `20261109121811 restrict_public_project_fields_and_split_read_policies` | `202611090007_restrict_public_project_fields.sql` | Source file found; timestamp differs |
| `20261109122044 capture_land_type_and_require_approved_monitoring_reporters` | `202611090006_...` and `202611090008_...` | Ambiguous duplicate/overlapping source files; production mapping not proven |

This narrows the missing/uncertain history to five early migration artifacts, the project-submission tightening migration, the exact historical version of the initial schema, and the final land-type migration selection. It does not authorize a fresh bootstrap or any production replay. The current production schema snapshot should be used as a validation target once the exact SQL is recovered.

The two land-type files were compared directly: their SQL statements are functionally the same; the differences are a descriptive comment and line wrapping around the check constraint. This makes the duplicate highly likely to be redundant, but it still does not establish which filename/version corresponds to the production migration record. Do not delete either migration or rewrite the applied history until the production migration artifact is verified.

## Definitive recovery: exact production migration SQL captured (2026-11-10)

The prior source-recovery blockers are resolved. The Supabase migration ledger stores the complete applied SQL in `supabase_migrations.schema_migrations.statements`. I retrieved all 14 rows directly from the connected production project's migration ledger and archived each statement set under:

`docs/operations/production-migration-snapshot/`

Verification was performed against the live ledger after writing the archive: **14 of 14 archived SQL files matched the corresponding production `statements` payload exactly**, including the previously missing `20261109121547_tighten_project_submission_and_staff_review_access` migration and the exact final land-type/approved-reporter migration. The earlier ambiguity between historical GitHub source files is therefore no longer a blocker for reconstructing the applied production sequence.

Important handling rule: this directory is a **forensic snapshot/archive**, not the active Supabase CLI migration directory. Do not copy these files into `supabase/migrations/`, rename them, or run/replay them against production. Their versions are already recorded as applied. The existing active migration directory still needs a deliberate reconciliation plan so that future development environments can reproduce the production schema without duplicate versions or accidental replays.

The initial schema snapshot also captures the exact production-applied form, rather than the later amended GitHub source version. The migration ledger snapshot is now the source of truth for the 14 applied migrations.

No SQL was applied, and no production database schema, policy, storage object, user data, Auth setting, or environment variable was changed during this recovery.
