# Data — SQL Style

- Lowercase keywords, one clause per line, trailing commas in select lists.
- CTEs over nested subqueries. Name each CTE for what it *is*.
- No `select *` in shipped queries. Alias every join. Comment any non-obvious filter.

```sql
with completed as (
  select
    profile_id,
    count(*) as challenges,
  from challenge_runs
  where status = 'completed'
  group by profile_id
)
select
  p.id,
  p.username,
  c.challenges,
from profiles as p
join completed as c on c.profile_id = p.id
where c.challenges >= 2;   -- power users: 2+ challenges
```
