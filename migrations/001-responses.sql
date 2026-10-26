CREATE TABLE IF NOT EXISTS wedding_responses (
  id uuid PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('rsvp', 'wish')),
  name varchar(80) NOT NULL CHECK (length(trim(name)) > 0),
  attending boolean,
  message varchar(500),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((kind = 'rsvp' AND attending IS NOT NULL AND message IS NULL)
    OR (kind = 'wish' AND attending IS NULL AND length(trim(message)) > 0 AND message IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS wedding_responses_kind_created ON wedding_responses (kind, created_at DESC, id DESC);
CREATE TABLE IF NOT EXISTS wedding_rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  resets_at timestamptz NOT NULL
);
