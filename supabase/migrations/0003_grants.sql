-- Explicit grants so the service_role key (used by API routes and the
-- seed script) can read/write every table. service_role bypasses RLS,
-- but still needs table-level privileges.

grant usage on schema public to service_role;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all functions in schema public to service_role;

alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on functions to service_role;

-- Also ensure anon can read the catalog + schedule views created in 0002.
grant select on movies_catalog to anon;
grant select on daily_puzzles_public to anon;
