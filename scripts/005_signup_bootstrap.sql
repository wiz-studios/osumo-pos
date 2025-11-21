-- signup_bootstrap: atomically create restaurant and owner staff record
-- Usage (server-only with service role):
--   select public.signup_bootstrap(p_user_id := 'uuid', p_first := 'John', p_last := 'Doe', p_restaurant_name := 'My Resto');
-- Returns: restaurant_id UUID

create or replace function public.signup_bootstrap(
  p_user_id uuid,
  p_first text,
  p_last text,
  p_restaurant_name text
) returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_restaurant_id uuid;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;
  if coalesce(trim(p_restaurant_name), '') = '' then
    raise exception 'p_restaurant_name is required';
  end if;

  -- Ensure the owner exists in auth.users (FK will also enforce)
  perform 1 from auth.users where id = p_user_id;
  if not found then
    raise exception 'Owner user (% ) does not exist', p_user_id;
  end if;

  -- Create restaurant
  insert into public.restaurants (name, owner_id)
  values (p_restaurant_name, p_user_id)
  returning id into v_restaurant_id;

  -- Create staff (manager)
  insert into public.staff (user_id, restaurant_id, role, first_name, last_name, active)
  values (p_user_id, v_restaurant_id, 'manager', p_first, p_last, true);

  return v_restaurant_id;
exception
  when others then
    raise;
end;
$$;

-- Restrict execution to service role only (remove public if exists)
revoke all on function public.signup_bootstrap(uuid, text, text, text) from public;
grant execute on function public.signup_bootstrap(uuid, text, text, text) to service_role;


