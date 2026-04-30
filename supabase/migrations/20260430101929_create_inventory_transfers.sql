-- Create inventory_transfers table for stock transfers between stores
create table if not exists public.inventory_transfers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  from_store_id uuid not null references public.stores(id) on delete cascade,
  to_store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity integer not null default 0,
  status text not null default 'PENDING' check (status in ('PENDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_transfers_org on public.inventory_transfers(organization_id);
create index if not exists idx_inventory_transfers_status on public.inventory_transfers(organization_id, status);
create index if not exists idx_inventory_transfers_from_store on public.inventory_transfers(from_store_id);
create index if not exists idx_inventory_transfers_to_store on public.inventory_transfers(to_store_id);
create index if not exists idx_inventory_transfers_created_at on public.inventory_transfers(created_at desc);

-- RLS policies for inventory_transfers
alter table public.inventory_transfers enable row level security;

create policy "Users can view transfers in their org"
  on public.inventory_transfers for select
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid() and is_active = true
  ));

create policy "Users can create transfers in their org"
  on public.inventory_transfers for insert
  with check (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid() and is_active = true
  ));

create policy "Users can update transfers in their org"
  on public.inventory_transfers for update
  using (organization_id in (
    select organization_id from public.organization_members where user_id = auth.uid() and is_active = true
  ));
