-- Dibs schema. Run in the Supabase SQL editor.
-- Writes happen only through server actions using the service-role key.
-- Anon clients get read-only access (needed for Realtime); rows are scoped by unguessable codes/UUIDs.

create table bills (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  merchant text not null default '',
  total int not null,            -- paise, as printed on the bill
  tax int not null default 0,
  service int not null default 0,
  discount int not null default 0,
  payer_name text not null,
  payer_vpa text not null,
  created_at timestamptz not null default now()
);

create table bill_secrets (
  bill_id uuid primary key references bills(id) on delete cascade,
  host_token text not null
);

create table items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  name text not null,
  qty int not null default 1,
  price int not null,            -- paise, whole line
  position int not null default 0
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table participant_secrets (
  participant_id uuid primary key references participants(id) on delete cascade,
  token text not null
);

create table claims (
  bill_id uuid not null references bills(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  primary key (item_id, participant_id)   -- a double tap can't create duplicates
);
create index on claims (bill_id);

alter table bills enable row level security;
alter table items enable row level security;
alter table participants enable row level security;
alter table claims enable row level security;
alter table bill_secrets enable row level security;        -- no policies: service role only
alter table participant_secrets enable row level security; -- no policies: service role only

create policy "read bills" on bills for select using (true);
create policy "read items" on items for select using (true);
create policy "read participants" on participants for select using (true);
create policy "read claims" on claims for select using (true);

alter publication supabase_realtime add table items, participants, claims;
