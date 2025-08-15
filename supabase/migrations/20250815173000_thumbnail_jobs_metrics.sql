-- Thumbnail jobs daily metrics view
-- Aggregates performance of image_thumbnail_jobs for the last 90 days

create or replace view public.vw_thumbnail_jobs_daily_ext as
select
  date_trunc('day', created_at)::date as day,
  count(*) as jobs,
  count(*) filter (where status = 'success') as success_jobs,
  count(*) filter (where status = 'error') as error_jobs,
  round((count(*) filter (where status='error')::numeric / greatest(count(*),1))*100, 2) as error_rate_pct,
  avg(duration_ms) as avg_duration_ms,
  percentile_cont(0.95) within group (order by duration_ms) as p95_duration_ms,
  max(duration_ms) as max_duration_ms
from public.image_thumbnail_jobs
where created_at >= now() - interval '90 days'
group by 1;

comment on view public.vw_thumbnail_jobs_daily_ext is 'Daily aggregated metrics for thumbnail generation jobs (90 day window).';

create index if not exists image_thumbnail_jobs_created_at_idx on public.image_thumbnail_jobs (created_at);
