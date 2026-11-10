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
- 20261109052831 projects_and_tree_survival_monitoring
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
