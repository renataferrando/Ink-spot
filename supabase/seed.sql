-- Style catalog seed — also included in 001_initial_schema.sql.
-- Run this if you need to re-seed styles without re-running the full migration.
INSERT INTO styles (slug, name) VALUES
  ('blackwork',       'Blackwork'),
  ('fine-line',       'Fine Line'),
  ('realism',         'Realism'),
  ('watercolor',      'Watercolor'),
  ('traditional',     'Traditional'),
  ('neo-traditional', 'Neo Traditional'),
  ('geometric',       'Geometric'),
  ('minimalist',      'Minimalist'),
  ('japanese',        'Japanese'),
  ('tribal',          'Tribal'),
  ('illustrative',    'Illustrative'),
  ('dotwork',         'Dotwork')
ON CONFLICT (slug) DO NOTHING;
