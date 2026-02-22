CREATE OR REPLACE FUNCTION public.update_workspace_company_name(
  target_workspace_id uuid,
  new_company_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_workspace_owner(target_workspace_id) THEN
    RAISE EXCEPTION 'Only workspace owners can update the company name';
  END IF;

  UPDATE proposals
  SET brand_overrides = COALESCE(brand_overrides, '{}'::jsonb) || jsonb_build_object('companyName', new_company_name)
  WHERE workspace_id = target_workspace_id;
END;
$$;
