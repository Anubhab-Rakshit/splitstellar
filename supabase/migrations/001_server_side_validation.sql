-- SplitStellar Server-Side Validation
-- Adds database-level validation triggers to enforce data integrity
-- regardless of which client is writing to Supabase.
--
-- Run: supabase db push  (or apply via Supabase Dashboard SQL Editor)

-- ── Utility: strip control characters and enforce length ──────────
CREATE OR REPLACE FUNCTION public.sanitize_text(input text, max_len int)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF input IS NULL THEN
    RETURN NULL;
  END IF;
  -- Remove control characters (keep newline/tab for multi-line fields)
  input := regexp_replace(input, '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', 'g');
  -- Trim
  input := trim(input);
  -- Enforce max length
  IF length(input) > max_len THEN
    input := left(input, max_len);
  END IF;
  RETURN input;
END;
$$;

-- ── profiles ──────────────────────────────────────────────────────
-- Enforce alias length (1-20 chars) and sanitize on INSERT/UPDATE
CREATE OR REPLACE FUNCTION public.validate_profiles()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.alias := public.sanitize_text(NEW.alias, 20);
  IF NEW.alias IS NULL OR length(NEW.alias) < 1 THEN
    RAISE EXCEPTION 'Profile alias must be 1-20 characters';
  END IF;
  IF NEW.wallet_address IS NULL OR length(NEW.wallet_address) < 56 THEN
    RAISE EXCEPTION 'Invalid wallet address format';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_profiles_trigger ON public.profiles;
CREATE TRIGGER validate_profiles_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profiles();

-- ── expenses ──────────────────────────────────────────────────────
-- Enforce amount > 0, description length, and payer address format
CREATE OR REPLACE FUNCTION public.validate_expenses()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'Expense amount must be greater than zero';
  END IF;
  NEW.description := public.sanitize_text(NEW.description, 128);
  IF NEW.description IS NULL OR length(NEW.description) < 1 THEN
    RAISE EXCEPTION 'Expense description is required (1-128 characters)';
  END IF;
  IF NEW.payer_address IS NULL OR length(NEW.payer_address) < 56 THEN
    RAISE EXCEPTION 'Invalid payer wallet address';
  END IF;
  IF NEW.pool_id IS NULL THEN
    RAISE EXCEPTION 'pool_id is required';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_expenses_trigger ON public.expenses;
CREATE TRIGGER validate_expenses_trigger
  BEFORE INSERT ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_expenses();

-- ── pool_members ──────────────────────────────────────────────────
-- Prevent duplicate memberships and validate addresses
CREATE OR REPLACE FUNCTION public.validate_pool_members()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pool_id IS NULL THEN
    RAISE EXCEPTION 'pool_id is required';
  END IF;
  IF NEW.wallet_address IS NULL OR length(NEW.wallet_address) < 56 THEN
    RAISE EXCEPTION 'Invalid wallet address';
  END IF;
  -- Check for existing membership (supplement the unique index)
  IF EXISTS (
    SELECT 1 FROM public.pool_members
    WHERE pool_id = NEW.pool_id AND wallet_address = NEW.wallet_address
  ) THEN
    RAISE EXCEPTION 'Wallet is already a member of this pool';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_pool_members_trigger ON public.pool_members;
CREATE TRIGGER validate_pool_members_trigger
  BEFORE INSERT ON public.pool_members
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_pool_members();

-- ── join_requests ─────────────────────────────────────────────────
-- Validate status values and prevent duplicate pending requests
CREATE OR REPLACE FUNCTION public.validate_join_requests()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status IS NOT NULL AND NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid join request status: %', NEW.status;
  END IF;
  IF NEW.pool_id IS NULL THEN
    RAISE EXCEPTION 'pool_id is required';
  END IF;
  IF NEW.requester_address IS NULL OR length(NEW.requester_address) < 56 THEN
    RAISE EXCEPTION 'Invalid requester wallet address';
  END IF;
  -- Prevent duplicate pending requests
  IF NEW.status = 'pending' OR NEW.status IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.join_requests
      WHERE pool_id = NEW.pool_id
        AND requester_address = NEW.requester_address
        AND status = 'pending'
    ) THEN
      RAISE EXCEPTION 'A pending join request already exists for this wallet and pool';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_join_requests_trigger ON public.join_requests;
CREATE TRIGGER validate_join_requests_trigger
  BEFORE INSERT ON public.join_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_join_requests();

-- ── expense_pools ─────────────────────────────────────────────────
-- Enforce pool name length and invite code format
CREATE OR REPLACE FUNCTION public.validate_expense_pools()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.name := public.sanitize_text(NEW.name, 64);
  IF NEW.name IS NULL OR length(NEW.name) < 1 THEN
    RAISE EXCEPTION 'Pool name must be 1-64 characters';
  END IF;
  IF NEW.invite_code IS NOT NULL THEN
    IF length(NEW.invite_code) != 8 OR NEW.invite_code !~ '^[A-Z0-9]{8}$' THEN
      RAISE EXCEPTION 'Invite code must be exactly 8 alphanumeric characters (A-Z, 2-9)';
    END IF;
  END IF;
  IF NEW.created_by IS NULL OR length(NEW.created_by) < 56 THEN
    RAISE EXCEPTION 'Invalid creator wallet address';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_expense_pools_trigger ON public.expense_pools;
CREATE TRIGGER validate_expense_pools_trigger
  BEFORE INSERT OR UPDATE ON public.expense_pools
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_expense_pools();

-- ── activities ────────────────────────────────────────────────────
-- Validate activity type and sanitize details
CREATE OR REPLACE FUNCTION public.validate_activities()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.type IS NULL OR length(NEW.type) < 1 THEN
    RAISE EXCEPTION 'Activity type is required';
  END IF;
  IF NEW.wallet_address IS NULL OR length(NEW.wallet_address) < 56 THEN
    RAISE EXCEPTION 'Invalid wallet address';
  END IF;
  -- Sanitize JSONB details: enforce max string lengths in nested fields
  IF NEW.details IS NOT NULL THEN
    IF NEW.details ? 'pool_name' THEN
      NEW.details := jsonb_set(
        NEW.details,
        '{pool_name}',
        to_jsonb(public.sanitize_text(NEW.details->>'pool_name', 64))
      );
    END IF;
    IF NEW.details ? 'description' THEN
      NEW.details := jsonb_set(
        NEW.details,
        '{description}',
        to_jsonb(public.sanitize_text(NEW.details->>'description', 128))
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_activities_trigger ON public.activities;
CREATE TRIGGER validate_activities_trigger
  BEFORE INSERT ON public.activities
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_activities();

-- ── analytics_events ──────────────────────────────────────────────
-- Basic validation for analytics inserts
CREATE OR REPLACE FUNCTION public.validate_analytics_events()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.event IS NULL OR length(NEW.event) < 1 THEN
    RAISE EXCEPTION 'Event name is required';
  END IF;
  IF length(NEW.event) > 100 THEN
    NEW.event := left(NEW.event, 100);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_analytics_events_trigger ON public.analytics_events;
CREATE TRIGGER validate_analytics_events_trigger
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_analytics_events();
