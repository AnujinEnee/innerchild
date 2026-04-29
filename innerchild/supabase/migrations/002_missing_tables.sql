-- ============================================================
-- Migration 002 — Missing tables
-- ============================================================

-- ─── ARTICLES: add free-text author_name column ─────────────
-- author_id still exists for structured references; author_name
-- is used for display when a free-text name is preferred.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS author_name TEXT;

-- ─── TEST QUESTIONS ──────────────────────────────────────────
-- (referenced in RLS policies in 001 but never created)

CREATE TABLE test_questions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id      UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  question     TEXT NOT NULL,
  order_index  SMALLINT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE test_question_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  score       SMALLINT NOT NULL DEFAULT 0,
  order_index SMALLINT NOT NULL DEFAULT 0
);

-- ─── TEST ANSWERS ─────────────────────────────────────────────

CREATE TABLE test_answers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_result_id   UUID NOT NULL REFERENCES test_results(id) ON DELETE CASCADE,
  question_id      UUID NOT NULL REFERENCES test_questions(id) ON DELETE CASCADE,
  selected_option  UUID REFERENCES test_question_options(id) ON DELETE SET NULL,
  score            SMALLINT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── SALARY RECORDS ───────────────────────────────────────────

CREATE TABLE salary_records (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id      UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  year                SMALLINT NOT NULL,
  month               SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  base_salary         INTEGER NOT NULL DEFAULT 0,
  bonus               INTEGER NOT NULL DEFAULT 0,
  consultation_income INTEGER NOT NULL DEFAULT 0,
  deductions          INTEGER NOT NULL DEFAULT 0,
  paid                BOOLEAN NOT NULL DEFAULT false,
  paid_at             TIMESTAMPTZ,
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_member_id, year, month)
);

-- ─── CONTENT (YouTube / Podcast) ──────────────────────────────

CREATE TYPE content_type AS ENUM ('youtube', 'podcast');

CREATE TABLE content (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  url         TEXT NOT NULL,
  type        content_type NOT NULL DEFAULT 'youtube',
  category    TEXT,
  thumbnail   TEXT,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── UPDATED_AT TRIGGERS ──────────────────────────────────────

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['salary_records', 'content'] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ─── RLS ──────────────────────────────────────────────────────

ALTER TABLE test_questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_answers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_records        ENABLE ROW LEVEL SECURITY;
ALTER TABLE content               ENABLE ROW LEVEL SECURITY;

-- Public can read active content
CREATE POLICY "public read content"
  ON content FOR SELECT USING (active = true);

-- Public can read test questions & options
CREATE POLICY "public read test questions"
  ON test_questions FOR SELECT USING (true);

CREATE POLICY "public read test question options"
  ON test_question_options FOR SELECT USING (true);

-- ─── INDEXES ──────────────────────────────────────────────────

CREATE INDEX idx_test_questions_test    ON test_questions(test_id, order_index);
CREATE INDEX idx_test_answers_result    ON test_answers(test_result_id);
CREATE INDEX idx_salary_member_month    ON salary_records(team_member_id, year, month);
CREATE INDEX idx_content_type_active    ON content(type, active);
