create type public.app_role as enum ('admin','customer');
create type public.plot_status as enum ('available','reserved','sold');
create type public.plot_facing as enum ('north','south','east','west');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  mobile text not null default '',
  address text not null default '',
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, mobile, address, email)
  values (new.id,
    coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce(new.raw_user_meta_data->>'mobile',''),
    coalesce(new.raw_user_meta_data->>'address',''),
    nullif(new.raw_user_meta_data->>'contact_email',''));
  -- first registered account becomes admin; everyone else is a customer
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  insert into public.user_roles (user_id, role) values (new.id, 'customer');
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.venture (
  id int primary key default 1 check (id = 1),
  name text not null,
  tagline text not null default '',
  about text not null default '',
  location text not null default '',
  address text not null default '',
  phone text not null default '',
  email text not null default '',
  whatsapp text not null default '',
  map_embed_url text not null default '',
  total_area_sqyd numeric not null default 0,
  updated_at timestamptz not null default now()
);
grant select on public.venture to anon, authenticated;
grant update, insert on public.venture to authenticated;
grant all on public.venture to service_role;
alter table public.venture enable row level security;
create policy "venture public read" on public.venture for select to anon, authenticated using (true);
create policy "venture admin write" on public.venture for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "venture admin insert" on public.venture for insert to authenticated with check (public.has_role(auth.uid(),'admin'));

create table public.phases (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.phases to anon, authenticated;
grant insert, update, delete on public.phases to authenticated;
grant all on public.phases to service_role;
alter table public.phases enable row level security;
create policy "phases public read" on public.phases for select to anon, authenticated using (true);
create policy "phases admin all" on public.phases for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.plots (
  id uuid primary key default gen_random_uuid(),
  plot_number int not null unique,
  phase_id uuid references public.phases(id) on delete set null,
  size_sqyd numeric not null check (size_sqyd > 0),
  price_per_sqyd numeric not null check (price_per_sqyd >= 0),
  total_price numeric generated always as (size_sqyd * price_per_sqyd) stored,
  facing plot_facing not null default 'east',
  status plot_status not null default 'available',
  dimensions text not null default '',
  location_note text not null default '',
  amenities text not null default '',
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.plots to anon, authenticated;
grant insert, update, delete on public.plots to authenticated;
grant all on public.plots to service_role;
alter table public.plots enable row level security;
create policy "plots public read" on public.plots for select to anon, authenticated using (true);
create policy "plots admin all" on public.plots for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.plots_touch()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  if new.status = 'sold' and new.sold_at is null then new.sold_at := now(); end if;
  if new.status <> 'sold' then new.sold_at := null; end if;
  return new;
end; $$;
create trigger plots_touch before insert or update on public.plots for each row execute function public.plots_touch();

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null check (char_length(name) between 1 and 100),
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  plot_id uuid references public.plots(id) on delete set null,
  kind text not null default 'contact' check (kind in ('contact','booking')),
  message text not null default '' check (char_length(message) <= 1000),
  status text not null default 'new' check (status in ('new','contacted','closed')),
  created_at timestamptz not null default now()
);
grant insert on public.enquiries to anon;
grant select, insert, update, delete on public.enquiries to authenticated;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
create policy "anyone can enquire" on public.enquiries for insert to anon, authenticated with check (user_id is null or user_id = auth.uid());
create policy "own or admin read" on public.enquiries for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin update" on public.enquiries for update to authenticated using (public.has_role(auth.uid(),'admin'));
create policy "admin delete" on public.enquiries for delete to authenticated using (public.has_role(auth.uid(),'admin'));

alter publication supabase_realtime add table public.plots;

-- SAMPLE DATA (for demonstration only)
insert into public.venture (id, name, tagline, about, location, address, phone, email, whatsapp, total_area_sqyd)
values (1, 'Sawargseema Ventures', 'Open plots in a planned, green layout',
 'Sample venture details for demonstration. Sawargseema Ventures offers residential open plots with wide internal roads, avenue plantation and planned utilities. Legal approval and registration status must be verified with the venture office before purchase.',
 'Sample location, Hyderabad outskirts, Telangana',
 'Sample office: Plot 12, Main Road, Shamshabad, Hyderabad 501218',
 '+91 90000 00000', 'info@sawargseema.example', '919000000000', 12000);

insert into public.phases (name, description, sort_order) values
 ('Phase 1','Sample phase near main entrance',1),
 ('Phase 2','Sample phase around central park',2),
 ('Phase 3','Sample phase at the rear side',3);

insert into public.plots (plot_number, phase_id, size_sqyd, price_per_sqyd, facing, status, dimensions, location_note, amenities, sold_at)
select n,
  (select id from public.phases where sort_order = ((n-1)/16)+1),
  (array[150,167,200,240,267,300])[1 + (n*7 % 6)],
  (array[8500,9000,9500])[((n-1)/16)+1] + (n % 3)*250,
  (array['north','south','east','west'])[1 + (n % 4)]::plot_facing,
  case when n % 5 = 0 then 'sold' when n % 7 = 0 then 'reserved' else 'available' end::plot_status,
  (array['30 x 45 ft','30 x 50 ft','36 x 50 ft','40 x 54 ft','40 x 60 ft','45 x 60 ft'])[1 + (n*7 % 6)],
  'Row ' || (((n-1)%16)/8 + 1) || ', ' || case when n % 8 in (0,1) then 'corner plot' else '30 ft internal road' end,
  '30 ft BT roads, underground drainage, electricity, avenue plantation, near school & bus stop',
  case when n % 5 = 0 then now() - ((n % 6) || ' months')::interval else null end
from generate_series(1,48) as n;
