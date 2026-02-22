-- Add SECURITY DEFINER RPC to activate pending workspace invites.
-- PostgREST cannot see pending invite rows (SELECT policy requires active membership),
-- so a direct UPDATE from the client silently matches 0 rows. This function bypasses
-- RLS to find and activate all pending invites matching the caller's email.

CREATE OR REPLACE FUNCTION public.activate_pending_invites_for_user(
  target_user_id uuid,
  target_email text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activated integer;
BEGIN
  IF target_user_id IS NULL OR target_email IS NULL OR target_email = '' THEN
    RETURN 0;
  END IF;

  IF target_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Cannot activate invites for another user';
  END IF;

  UPDATE public.workspace_members
  SET user_id = target_user_id,
      status = 'active'
  WHERE user_id IS NULL
    AND status = 'pending'
    AND lower(email) = lower(target_email);

  GET DIAGNOSTICS activated = ROW_COUNT;
  RETURN activated;
END;
$$;
