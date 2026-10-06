-- Dibs schema v2. Run once in the Supabase SQL editor on a fresh project.
-- If you ran the old MVP schema first, run supabase/drop-mvp.sql before this file.
--
-- Security model: every table has row-level security ON and NO policies, so the anon key can read
-- nothing. The app talks to the database only from the server, with the service-role key.
-- Access to a bill is a capability: the host token (cookie) or a participant token (cookie).
-- Tokens are stored as SHA-256 hashes.

create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,                 -- 7 chars in the share link
  ref text not null,                         -- 3 chars in the UPI note, e.g. 7K2
  merchant text not null default '',
  total int not null check (total > 0),      -- paise, as printed on the bill
  status text not null default 'draft' check (status in ('draft', 'open')),
  payer_name text not null,
  payer_vpa text not null,
  thumb text,                                -- small data-URL thumbnail, display only
  short_at_share int not null default 0,     -- paise short (-) or over (+) when shared anyway
  created_at timestamptz not null default now(),
  shared_at timestamptz
);

create table if not exists bill_secrets (
  bill_id uuid primary key references bills(id) on delete cascade,
  host_token_hash text not null
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  name text not null,
  qty int not null default 1 check (qty > 0),
  price int not null check (price >= 0),     -- paise, whole line, before tax
  position int not null default 0,
  flag jsonb                                 -- {read, why} when the scan was unsure
);
create index if not exists items_bill on items (bill_id);

create table if not exists charges (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  label text not null,
  kind text not null check (kind in ('tax', 'service', 'discount')),
  amount int not null,                       -- paise; a round-off may be negative
  position int not null default 0
);
create index if not exists charges_bill on charges (bill_id);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  name text not null,
  is_host boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists participants_bill on participants (bill_id);

create table if not exists participant_secrets (
  participant_id uuid primary key references participants(id) on delete cascade,
  token_hash text not null
);

create table if not exists claims (
  bill_id uuid not null references bills(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  primary key (item_id, participant_id)      -- a double tap cannot create duplicates
);
create index if not exists claims_bill on claims (bill_id);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references bills(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  kind text not null check (kind in ('upi', 'cash')),
  said int not null check (said >= 0),       -- paise the friend says they paid (or host recorded)
  utr text,
  shot jsonb,                                -- what the vision model read from the screenshot (image is not kept)
  status text not null default 'says' check (status in ('says', 'confirmed', 'rejected')),
  confirmed int not null default 0,          -- paise the host saw in the bank app
  waived int not null default 0,             -- shortfall the host chose to accept
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists payments_bill on payments (bill_id);

alter table bills enable row level security;
alter table bill_secrets enable row level security;
alter table items enable row level security;
alter table charges enable row level security;
alter table participants enable row level security;
alter table participant_secrets enable row level security;
alter table claims enable row level security;
alter table payments enable row level security;
