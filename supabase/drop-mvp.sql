-- Removes the tables created by the first MVP schema (and any test bills in them).
-- Run this only if you ran the old schema; then run schema.sql.
drop table if exists claims cascade;
drop table if exists participant_secrets cascade;
drop table if exists participants cascade;
drop table if exists items cascade;
drop table if exists bill_secrets cascade;
drop table if exists bills cascade;
