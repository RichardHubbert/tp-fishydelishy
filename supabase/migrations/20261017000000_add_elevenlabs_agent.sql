alter table public.restaurants
  add column if not exists elevenlabs_enabled boolean not null default false,
  add column if not exists elevenlabs_agent_id text;
