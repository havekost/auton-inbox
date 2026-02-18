-- Auton Inbox: Supabase Schema
-- Run this in the Supabase SQL editor to set up your database.

-- Inboxes table
create table if not exists inboxes (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamptz default now()
);

-- Messages table (webhook payloads received)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  inbox_id uuid references inboxes(id) on delete cascade not null,
  headers jsonb,
  body jsonb,
  method text default 'POST',
  received_at timestamptz default now()
);

-- Index for fast lookups by inbox
create index if not exists idx_messages_inbox_id on messages(inbox_id);

-- Enable Realtime on messages table
alter publication supabase_realtime add table messages;

-- Row Level Security (permissive for simplicity — tighten for production)
alter table inboxes enable row level security;
alter table messages enable row level security;

create policy "Allow all access to inboxes" on inboxes for all using (true) with check (true);
create policy "Allow all access to messages" on messages for all using (true) with check (true);
