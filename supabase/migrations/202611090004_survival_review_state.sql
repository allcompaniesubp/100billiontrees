-- Review-state extension for per-tree survival observations.
alter table public.tree_survival_logs
  add column if not exists review_status text not null default 'pending';
alter table public.tree_survival_logs
  drop constraint if exists tree_survival_logs_review_status_check;
alter table public.tree_survival_logs
  add constraint tree_survival_logs_review_status_check
  check (review_status in ('pending','approved','rejected'));
grant update (reviewer_approved, reviewed_by, reviewed_at, review_status)
  on public.tree_survival_logs to authenticated;
