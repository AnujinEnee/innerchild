-- ============================================================
-- Inner Child Psychology Platform — Initial Schema
-- ============================================================

-- ─── ENUMS ───────────────────────────────────────────────────

CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
CREATE TYPE consultation_type AS ENUM ('online', 'offline');
CREATE TYPE consultation_status AS ENUM ('normal', 'cancelled', 'completed');
CREATE TYPE beverage_type AS ENUM ('water', 'green_tea', 'black_tea', 'coffee');
CREATE TYPE test_level AS ENUM ('low', 'medium', 'high', 'normal');
CREATE TYPE article_status AS ENUM ('draft', 'published');
CREATE TYPE submitted_article_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE team_role AS ENUM ('psychologist', 'therapist');
CREATE TYPE task_type AS ENUM ('online', 'offline');

-- ─── ADMIN USERS ─────────────────────────────────────────────

CREATE TABLE admin_users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  image_url   TEXT,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TEAM MEMBERS ────────────────────────────────────────────

CREATE TABLE team_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_name     TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  role          team_role NOT NULL,
  expertise     TEXT,
  education     TEXT,
  experience    TEXT,
  bio           TEXT,
  phone         TEXT,
  address       TEXT,
  bank_name     TEXT,
  bank_account  TEXT,
  image_url     TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── CLIENTS (USERS) ─────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- links to Supabase Auth; nullable for guest/legacy records
  auth_id       UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  last_name     TEXT NOT NULL,
  first_name    TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  extra_phone   TEXT,
  age           SMALLINT CHECK (age > 0 AND age < 150),
  gender        gender_type,
  profession    TEXT,
  address       TEXT,
  bank_name     TEXT,
  bank_account  TEXT,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── CONSULTATIONS ───────────────────────────────────────────

CREATE TABLE consultations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counselor_id        UUID REFERENCES team_members(id) ON DELETE SET NULL,
  type                consultation_type NOT NULL,
  date                DATE NOT NULL,
  time                TIME NOT NULL,
  duration_minutes    SMALLINT NOT NULL DEFAULT 60,
  status              consultation_status NOT NULL DEFAULT 'normal',
  price               INTEGER NOT NULL, -- in MNT (50000 or 80000)
  beverage_preference beverage_type,
  notes               TEXT,
  paid_at             TIMESTAMPTZ,
  refunded_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── TESTS ───────────────────────────────────────────────────

CREATE TABLE tests (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  description      TEXT,
  category         TEXT NOT NULL,
  duration_minutes SMALLINT NOT NULL DEFAULT 10,
  active           BOOLEAN NOT NULL DEFAULT true,
  created_by       UUID REFERENCES team_members(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);



CREATE TABLE test_results (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id        UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  score          SMALLINT NOT NULL,
  max_score      SMALLINT NOT NULL,
  level          test_level NOT NULL,
  duration_secs  INTEGER,
  conclusion     TEXT,
  recommendation TEXT,
  taken_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);



-- ─── ARTICLES ────────────────────────────────────────────────

CREATE TABLE articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  category     TEXT NOT NULL,
  author_id    UUID REFERENCES team_members(id) ON DELETE SET NULL,
  image_url    TEXT,
  status       article_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE submitted_articles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  author_name  TEXT NOT NULL,
  author_email TEXT NOT NULL,
  status       submitted_article_status NOT NULL DEFAULT 'pending',
  reviewed_by  UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  reviewed_at  TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── WORK TASKS (TEAM SCHEDULE) ──────────────────────────────

CREATE TABLE work_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id   UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  consultation_id  UUID REFERENCES consultations(id) ON DELETE SET NULL,
  date             DATE NOT NULL,
  time             TIME NOT NULL,
  duration_minutes SMALLINT NOT NULL DEFAULT 60,
  type             task_type NOT NULL,
  client_name      TEXT, -- denormalized for display when client record may not exist
  done             BOOLEAN NOT NULL DEFAULT false,
  income           INTEGER NOT NULL DEFAULT 0, -- in MNT
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── NEWSLETTER ──────────────────────────────────────────────

CREATE TABLE newsletter_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  subscribed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── UPDATED_AT TRIGGER ──────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'admin_users', 'team_members', 'users', 'consultations',
    'tests', 'articles', 'work_tasks'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %s
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END;
$$;

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────

ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results            ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE submitted_articles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_tasks              ENABLE ROW LEVEL SECURITY;

-- Public read: articles (published only), tests (active), team members
CREATE POLICY "public read published articles"
  ON articles FOR SELECT USING (status = 'published');

CREATE POLICY "public read active tests"
  ON tests FOR SELECT USING (active = true);

CREATE POLICY "public read team members"
  ON team_members FOR SELECT USING (true);

-- Users: can read/update their own row
CREATE POLICY "users read own row"
  ON users FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "users update own row"
  ON users FOR UPDATE USING (auth.uid() = auth_id);

-- Users can insert their own record during registration
CREATE POLICY "users insert own row"
  ON users FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Consultations: clients see their own
CREATE POLICY "clients read own consultations"
  ON consultations FOR SELECT USING (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Test results: clients see their own
CREATE POLICY "clients read own test results"
  ON test_results FOR SELECT USING (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

CREATE POLICY "clients insert test results"
  ON test_results FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  );

-- Newsletter: anyone can subscribe
CREATE POLICY "public insert newsletter"
  ON newsletter_subscriptions FOR INSERT WITH CHECK (true);

-- Submitted articles: anyone can submit
CREATE POLICY "public insert submitted articles"
  ON submitted_articles FOR INSERT WITH CHECK (true);

-- ─── INDEXES ─────────────────────────────────────────────────

CREATE INDEX idx_users_email          ON users(email);
CREATE INDEX idx_users_auth_id        ON users(auth_id);
CREATE INDEX idx_consultations_client ON consultations(client_id);
CREATE INDEX idx_consultations_date   ON consultations(date);
CREATE INDEX idx_test_results_client  ON test_results(client_id);
CREATE INDEX idx_test_results_test    ON test_results(test_id);
CREATE INDEX idx_articles_status      ON articles(status, published_at DESC);
CREATE INDEX idx_work_tasks_member    ON work_tasks(team_member_id, date);
