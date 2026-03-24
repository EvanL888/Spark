-- =============================================
-- SPARK - Local JSON Store
-- Applied automatically at startup via db.ts
-- =============================================

-- -- USERS ------------------------------------
create table if not exists users (
  id          text primary key,
  email       text unique not null,
  first_name  text not null,
  university  text,
  campus_id   text,
  interests   text default '[]',
  prompts     text default '[]',
  push_token  text,
  created_at  text default (datetime('now')),
  updated_at  text default (datetime('now'))
);

-- RLS: users can only read/write their own row
-- RLS is not applicable for local SQLite

-- -- AVAILABILITY WINDOWS ----------------------
create table if not exists availability_windows (
  id          text primary key,
  user_id     text not null,
  start_time  text not null,
  end_time    text not null,
  expires_at  text not null,
  created_at  text default (datetime('now'))
);

-- -- DAILY MATCHES -----------------------------
create table if not exists daily_matches (
  id               text primary key,
  user_id          text not null,
  matched_user_id  text not null,
  match_score      real not null,
  overlap_start    text not null,
  overlap_end      text not null,
  shared_interests text default '[]',
  status           text default 'pending',
  responded_at     text,
  expires_at       text not null,
  created_at       text default (datetime('now'))
);

-- -- SPARKS ------------------------------------
create table if not exists sparks (
  id             text primary key,
  match_a_id     text,
  match_b_id     text,
  user_a_id      text not null,
  user_b_id      text not null,
  user_a_activity text,
  user_b_activity text,
  activity_id    text,
  activity_name  text,
  venue_id       text,
  venue_name     text,
  venue_address  text,
  meet_time      text,
  icebreaker     text,
  status         text default 'activity_pending',
  created_at     text default (datetime('now'))
);

-- -- SPARK RATINGS -----------------------------
create table if not exists spark_ratings (
  id               text primary key,
  spark_id         text not null,
  rater_id         text not null,
  stars            integer not null,
  would_meet_again integer not null,
  created_at       text default (datetime('now')),
  unique (spark_id, rater_id)
);

-- -- HELPER: auto-update updated_at ------------
-- updated_at is handled in application code
