-- FIX: Robust handle_new_user function to support both Owner Signup and Staff Creation

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_business_id uuid;
  v_role text;
  v_full_name text;
  v_phone text;
  v_meta_business_id text;
  v_meta_business_name text;
begin
  -- Extract metadata
  v_full_name := new.raw_user_meta_data->>'full_name';
  v_role := coalesce(new.raw_user_meta_data->>'role', 'owner'); -- Default to owner if missing
  v_phone := new.raw_user_meta_data->>'phone';
  v_meta_business_id := new.raw_user_meta_data->>'business_id';
  v_meta_business_name := new.raw_user_meta_data->>'business_name';

  -- CASE A: Staff/Cashier Creation (Existing Business)
  -- If business_id is provided in metadata, use it directly.
  if v_meta_business_id is not null then
    begin
      v_business_id := v_meta_business_id::uuid;
    exception when others then
      v_business_id := null;
    end;
  
  -- CASE B: New Owner Signup (New Business)
  -- If no business_id provided, create a new business.
  else
    if v_meta_business_name is not null then
       insert into public.businesses (
          name, 
          business_type, 
          owner_id
       ) values (
          v_meta_business_name,
          coalesce(new.raw_user_meta_data->>'business_type', 'retail'),
          new.id
       ) returning id into v_business_id;
    end if;
  end if;

  -- Insert into public.users
  insert into public.users (
    id, 
    email, 
    full_name, 
    role,
    business_id, 
    phone,
    onvo_customer_id,
    subscription_status,
    subscription_plan
  )
  values (
    new.id,
    new.email,
    v_full_name,
    v_role,
    v_business_id,
    v_phone,
    new.raw_user_meta_data->>'onvo_customer_id',
    'trialing', -- Default status
    coalesce(new.raw_user_meta_data->>'selected_plan', 'solo') -- Default plan
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, users.full_name),
    role = coalesce(excluded.role, users.role),
    business_id = coalesce(excluded.business_id, users.business_id),
    phone = coalesce(excluded.phone, users.phone);

  return new;
exception
  when others then
    -- Log error but don't block auth user creation
    raise warning 'Error in handle_new_user trigger: %', SQLERRM;
    return new;
end;
$$;

-- Recreate trigger to ensure it uses the updated function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
