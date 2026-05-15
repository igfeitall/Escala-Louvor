BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  church_name text NOT NULL,
  church_phone text NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  weekday smallint NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_types_user_id_name_key UNIQUE (user_id, name),
  CONSTRAINT service_types_weekday_check CHECK (weekday BETWEEN 0 AND 6)
);

CREATE TABLE IF NOT EXISTS ministries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ministries_user_id_name_key UNIQUE (user_id, name)
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id uuid NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  name text NOT NULL,
  normalized_name text NOT NULL,
  email text NOT NULL,
  phone text NULL,
  notes text NULL,
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  roles jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT members_ministry_id_normalized_name_key UNIQUE (
    ministry_id,
    normalized_name
  )
);

CREATE TABLE IF NOT EXISTS member_monthly_unavailabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  schedule_month date NOT NULL,
  service_date date NOT NULL,
  service_type_id uuid NOT NULL REFERENCES service_types(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_monthly_unavailabilities_member_service_key UNIQUE (
    member_id,
    service_date,
    service_type_id
  ),
  CONSTRAINT member_monthly_unavailabilities_schedule_month_check CHECK (
    schedule_month = date_trunc('month', schedule_month)::date
  )
);

CREATE TABLE IF NOT EXISTS saved_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ministry_id uuid NOT NULL REFERENCES ministries(id) ON DELETE CASCADE,
  schedule_month date NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_schedules_ministry_id_schedule_month_key UNIQUE (
    ministry_id,
    schedule_month
  ),
  CONSTRAINT saved_schedules_schedule_month_check CHECK (
    schedule_month = date_trunc('month', schedule_month)::date
  )
);

CREATE TABLE IF NOT EXISTS saved_schedule_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_schedule_id uuid NOT NULL REFERENCES saved_schedules(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  service_type_id uuid NOT NULL REFERENCES service_types(id),
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_schedule_services_schedule_service_key UNIQUE (
    saved_schedule_id,
    service_date,
    service_type_id
  )
);

CREATE TABLE IF NOT EXISTS saved_schedule_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_schedule_service_id uuid NOT NULL REFERENCES saved_schedule_services(id) ON DELETE CASCADE,
  role_name text NOT NULL,
  member_id uuid NOT NULL REFERENCES members(id),
  slot_index integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT saved_schedule_assignments_service_role_slot_key UNIQUE (
    saved_schedule_service_id,
    role_name,
    slot_index
  )
);

CREATE INDEX IF NOT EXISTS service_types_user_id_idx
  ON service_types(user_id);

CREATE INDEX IF NOT EXISTS ministries_user_id_idx
  ON ministries(user_id);

CREATE INDEX IF NOT EXISTS members_ministry_id_idx
  ON members(ministry_id);

CREATE INDEX IF NOT EXISTS member_monthly_unavailabilities_member_id_idx
  ON member_monthly_unavailabilities(member_id);

CREATE INDEX IF NOT EXISTS member_monthly_unavailabilities_schedule_month_idx
  ON member_monthly_unavailabilities(schedule_month);

CREATE INDEX IF NOT EXISTS member_monthly_unavailabilities_service_type_id_idx
  ON member_monthly_unavailabilities(service_type_id);

CREATE INDEX IF NOT EXISTS saved_schedules_ministry_id_idx
  ON saved_schedules(ministry_id);

CREATE INDEX IF NOT EXISTS saved_schedules_schedule_month_idx
  ON saved_schedules(schedule_month);

CREATE INDEX IF NOT EXISTS saved_schedule_services_saved_schedule_id_idx
  ON saved_schedule_services(saved_schedule_id);

CREATE INDEX IF NOT EXISTS saved_schedule_services_service_type_id_idx
  ON saved_schedule_services(service_type_id);

CREATE INDEX IF NOT EXISTS saved_schedule_assignments_service_id_idx
  ON saved_schedule_assignments(saved_schedule_service_id);

CREATE INDEX IF NOT EXISTS saved_schedule_assignments_member_id_idx
  ON saved_schedule_assignments(member_id);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS service_types_set_updated_at ON service_types;
CREATE TRIGGER service_types_set_updated_at
BEFORE UPDATE ON service_types
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS ministries_set_updated_at ON ministries;
CREATE TRIGGER ministries_set_updated_at
BEFORE UPDATE ON ministries
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS members_set_updated_at ON members;
CREATE TRIGGER members_set_updated_at
BEFORE UPDATE ON members
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION purge_expired_saved_schedules(reference_date date DEFAULT CURRENT_DATE)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM saved_schedules
  WHERE schedule_month <= date_trunc('month', reference_date)::date - INTERVAL '3 months';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION purge_expired_saved_schedules_on_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM purge_expired_saved_schedules();
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS saved_schedules_purge_expired_on_write ON saved_schedules;
CREATE TRIGGER saved_schedules_purge_expired_on_write
BEFORE INSERT OR UPDATE ON saved_schedules
FOR EACH STATEMENT
EXECUTE FUNCTION purge_expired_saved_schedules_on_write();

COMMIT;
