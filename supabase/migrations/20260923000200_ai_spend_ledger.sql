-- The AI spend ledger. One row per (day, scope, model), incremented by this
-- function rather than read-then-write from the app: a spend ceiling cannot
-- afford to undercount, and the moment it matters is the moment many calls are
-- in flight. See docs/adr/0006-cost-metered-at-the-client.md.

create table ai_spend_daily (
  day date not null,
  scope text not null,
  model text not null,
  input_tokens bigint not null default 0,
  output_tokens bigint not null default 0,
  cost_usd numeric(12, 6) not null default 0,
  -- false when we had no price for the model, so an unpriced row is visible as
  -- "unknown" rather than indistinguishable from a genuinely cheap day.
  priced boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (day, scope, model)
);

create index ai_spend_daily_day_idx on ai_spend_daily (day);

create function record_ai_spend(
  p_day date,
  p_scope text,
  p_model text,
  p_input_tokens bigint,
  p_output_tokens bigint,
  p_cost_usd numeric,
  p_priced boolean
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into ai_spend_daily as t (
    day, scope, model, input_tokens, output_tokens, cost_usd, priced, updated_at
  )
  values (
    p_day, p_scope, p_model, p_input_tokens, p_output_tokens, p_cost_usd, p_priced, now()
  )
  on conflict (day, scope, model) do update set
    input_tokens = t.input_tokens + excluded.input_tokens,
    output_tokens = t.output_tokens + excluded.output_tokens,
    cost_usd = t.cost_usd + excluded.cost_usd,
    priced = t.priced and excluded.priced,
    updated_at = now();
$$;

alter table ai_spend_daily enable row level security;
-- No policies: the ledger is written by the service role and read by admins.
-- An empty policy set denies everyone else, which is the intent.
