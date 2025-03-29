
-- Create app_config table if not exists function
create or replace function create_app_config_if_not_exists()
returns void as $$
begin
  -- Check if the table exists
  if not exists (
    select from information_schema.tables 
    where table_schema = 'public' 
    and table_name = 'app_config'
  ) then
    -- Create the table
    create table public.app_config (
      key text primary key,
      value text not null,
      created_at timestamp with time zone default now() not null,
      updated_at timestamp with time zone default now() not null
    );

    -- Set RLS
    alter table public.app_config enable row level security;

    -- Grant access to authenticated users
    grant all on table public.app_config to authenticated;

    -- Create policy
    create policy "Admins can read and write app_config"
      on public.app_config
      as permissive
      for all
      to authenticated
      using ((auth.jwt() ->> 'email'::text) = 'nandoesporte1@gmail.com' or 
             exists (
               select 1 from public.user_profiles
               where user_profiles.id = auth.uid() and user_profiles.is_admin = true
             ));
  end if;
end;
$$ language plpgsql;
