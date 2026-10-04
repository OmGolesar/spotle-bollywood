-- Chunk 14 — box office in its native currency, with a source attribution.
--
-- box_office_cr was always INR crore and often came from TMDB's `revenue`
-- field (worldwide USD gross divided by 10M). That silently gave very
-- wrong numbers for Indian films — ₹15 cr for Dhurandhar, etc.
--
-- These three columns capture the figure as Wikipedia/Wikidata actually
-- reports it: a raw amount, a currency unit (INR crore, USD million,
-- USD billion), and the source. The old box_office_cr column stays as
-- the comparison-normalised value (converted to crore equivalent so
-- tile math still works across films reported in different currencies).

alter table movies
  add column if not exists box_office_amount numeric,
  add column if not exists box_office_currency text
    check (box_office_currency in ('INR_CR', 'USD_M', 'USD_B') or box_office_currency is null),
  add column if not exists box_office_source text
    check (box_office_source in ('wikipedia', 'wikidata', 'tmdb', 'manual') or box_office_source is null);
