# Staff authorization hardening — review proposal

Date: 2026-11-10  
Repository: `allcompaniesubp/100billiontrees`  
Production Supabase project: `xuglowoqhbdngripaojk`

## Status

**Proposal only. Not applied to production. Not an active Supabase migration.**

This proposal was prepared after a read-only inspection of production RLS policies, function grants, application routes, and the current UI. There is no isolated PostgreSQL/Supabase test branch available on the current Free-tier project, so the SQL below has not been executed or represented as tested.

## Findings confirmed by read-only inspection

1. `private.is_staff()` is a `SECURITY DEFINER` SQL function owned by `postgres`, with an empty search path. It checks the current `public.profiles` row for role `administrator` or `reviewer` **and** `approval_status = 'approved'`. EXECUTE is granted to `authenticated`, not `anon`.
2. The community post SELECT and UPDATE policies use `auth.jwt()->'app_metadata'->>'role'` for moderator access. These claims may be stale until token refresh and do not consult the current profile approval state.
3. The current support conversation and message staff branches check `profiles.role` but do not consistently require `approval_status = 'approved'`.
4. The support API routes independently check both role and approval status. The current UI's staff-inbox indicator checks role only, so it can display a staff state that the database should deny.
5. The community UI allows members to submit media and view their own posts, but the repository currently has no moderator review queue or approve/reject controls. A database policy change alone does not complete moderation operations.
6. The current production profile query found one approved administrator and one pending member. Neither profile's joined `auth.users.raw_app_meta_data.role` currently contains `administrator` or `reviewer`. This is evidence that the current app_metadata-based community moderator path may not recognise the approved administrator; it is not proof of a user-facing exploit.

## Proposed policy alignment

The companion SQL proposal:

- Splits anonymous community reads from authenticated reads, so the private-schema helper is only invoked for authenticated users.
- Uses `private.is_staff()` for authenticated moderator read/update access to community posts.
- Extends private community-media reads to approved staff for posts in any moderation state, while retaining owner access and public-approved post behaviour.
- Uses `private.is_staff()` for staff branches in support conversation and message SELECT/INSERT policies.
- Leaves member ownership paths, member upload eligibility, and all table schemas unchanged.

The proposal does not change profile role assignment, JWT claims, grants, bucket configuration, or any production data.

## Required validation before adoption

Run in a disposable Supabase/PostgreSQL environment with separate test identities:

| Identity | Expected community post access | Expected private media access | Expected support access |
|---|---|---|---|
| Anonymous | Approved posts only | No private bucket access | None |
| Ordinary approved member | Approved posts and own posts | Approved media and own uploads | Own conversations only |
| Pending member | Own posts; no moderator access | Own uploads only | Own conversations only |
| Approved reviewer | All posts for moderation | Media attached to posts under review | All support conversations |
| Approved administrator | All posts for moderation | Media attached to posts under review | All support conversations |
| Suspended/rejected former staff | No staff privileges | No staff-only media access | No staff inbox access |

Also test:
- A staff token issued before approval is revoked; the database policy must deny access based on the current profile state.
- UPDATE cannot change a post into an unauthorised state or preserve staff access after suspension.
- Storage signed-URL creation and media retrieval work for authorised moderators and fail for unauthorised users.
- Members can still submit pending media, see their own posts, create support conversations, and reply to their own threads.
- Anonymous community visitors can still see approved posts.
- The community moderation UI is implemented and uses the same approval rules before any production rollout.

## Rollout guardrails

1. Do not copy this file into `supabase/migrations/` or apply it directly to production.
2. First create or provision a disposable database without activating a paid Supabase service. The current project has no Supabase database branches.
3. Validate policy semantics and UI workflows with distinct identities.
4. Review the exact resulting policy definitions and rerun Supabase security/performance advisors.
5. Prepare a numbered migration through the normal Supabase CLI workflow only after the baseline is reproducible.
6. Obtain explicit approval before any production database change.

## Files

- `staff-authorization-hardening-proposal.sql`: review-only SQL patch.
- `staff-authorization-hardening-review.md`: findings, expected access matrix, and rollout checklist.

