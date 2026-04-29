-- ============================================================
-- Migration 006 — Test logics: alter level column, seed tests, add raw_answers
-- ============================================================

-- ─── ALTER level column from enum to TEXT ───────────────────
-- The TS-based tests produce Mongolian-language level strings
-- that don't fit the existing 4-value enum.
ALTER TABLE test_results ALTER COLUMN level TYPE TEXT USING level::TEXT;
DROP TYPE IF EXISTS test_level;

-- ─── Add raw_answers JSONB column ──────────────────────────
-- Since questions live in TS files (not test_questions table),
-- we store per-question answers as JSON instead of test_answers.
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS raw_answers JSONB;

-- ─── Seed 8 psychological test entries ─────────────────────
INSERT INTO tests (id, title, description, category, duration_minutes, active) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Сэтгэл гутрал (BDI)', 'Сэтгэл гутралын түвшинг тодорхойлох Бекийн сорил', 'depression', 10, true),
  ('a0000001-0000-0000-0000-000000000002', 'Сэтгэл түгшилт (State & Trait)', 'Сэтгэл түгшилтийн түвшинг үнэлэх хоёр хэсэгтэй сорил', 'anxiety', 15, true),
  ('a0000001-0000-0000-0000-000000000003', 'Стрессийг илрүүлэх тест', 'Таны стрессийн түвшинг тодорхойлох тест', 'stress', 8, true),
  ('a0000001-0000-0000-0000-000000000004', 'Зан төлөв (Леонгард)', '97 асуултаар зан төлвийн 10 хэмжигдэхүүнийг тодорхойлно', 'personality', 25, true),
  ('a0000001-0000-0000-0000-000000000005', 'Люшерийн өнгөний сорил', 'Өнгөний сонголтоор сэтгэл зүйн байдлыг тодорхойлно', 'personality', 5, true),
  ('a0000001-0000-0000-0000-000000000006', 'OCD (Y-BOCS)', 'Улигт бодол ба албадмал үйлдлийн түвшинг тодорхойлох', 'ocd', 8, true),
  ('a0000001-0000-0000-0000-000000000007', 'Тархины давамгай тал', 'Зүүн/баруун тархины давамгай хөгжлийг тодорхойлно', 'brain', 10, true),
  ('a0000001-0000-0000-0000-000000000008', 'Донтолт илрүүлэх тест', 'Донтох бодисын хэрэглээний түвшинг тодорхойлох', 'addiction', 10, true)
ON CONFLICT (id) DO NOTHING;
