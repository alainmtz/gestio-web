drop extension if exists "pg_net";

drop trigger if exists "cash_registers_audit_delete" on "public"."cash_registers";

drop trigger if exists "cash_registers_audit_insert" on "public"."cash_registers";

drop trigger if exists "cash_registers_audit_update" on "public"."cash_registers";

drop trigger if exists "customers_audit_delete" on "public"."customers";

drop trigger if exists "customers_audit_insert" on "public"."customers";

drop trigger if exists "customers_audit_update" on "public"."customers";

drop trigger if exists "invoices_audit_delete" on "public"."invoices";

drop trigger if exists "invoices_audit_insert" on "public"."invoices";

drop trigger if exists "invoices_audit_update" on "public"."invoices";

drop trigger if exists "offers_audit_delete" on "public"."offers";

drop trigger if exists "offers_audit_insert" on "public"."offers";

drop trigger if exists "offers_audit_update" on "public"."offers";

drop trigger if exists "products_audit_delete" on "public"."products";

drop trigger if exists "products_audit_insert" on "public"."products";

drop trigger if exists "products_audit_update" on "public"."products";

drop trigger if exists "stores_audit_delete" on "public"."stores";

drop trigger if exists "stores_audit_insert" on "public"."stores";

drop trigger if exists "stores_audit_update" on "public"."stores";

drop trigger if exists "update_consignment_documents_updated_at_trigger" on "public"."consignment_documents";

drop trigger if exists "update_consignment_stock_updated_at" on "public"."consignment_stock";

drop trigger if exists "update_inventory_updated_at" on "public"."inventory";

drop trigger if exists "update_organization_settings_updated_at" on "public"."organization_settings";

drop trigger if exists "trigger_organization_created" on "public"."organizations";

drop trigger if exists "trigger_organization_settings_created" on "public"."organizations";

drop trigger if exists "update_organizations_updated_at" on "public"."organizations";

drop trigger if exists "update_product_categories_updated_at" on "public"."product_categories";

drop trigger if exists "update_products_updated_at" on "public"."products";

drop trigger if exists "update_profiles_updated_at" on "public"."profiles";

drop trigger if exists "trg_sync_store_currency_code" on "public"."stores";

drop trigger if exists "update_stores_updated_at" on "public"."stores";

drop trigger if exists "update_teams_updated_at" on "public"."teams";

drop trigger if exists "update_work_schedules_updated_at" on "public"."work_schedules";

drop policy "Users can view consignment" on "public"."consignment_stock";

drop policy "currencies_delete_service_role" on "public"."currencies";

drop policy "currencies_insert_service_role" on "public"."currencies";

drop policy "currencies_update_service_role" on "public"."currencies";

drop policy "Users can view customers" on "public"."customers";

drop policy "Users can view invoices" on "public"."invoices";

drop policy "Admins can create ElToque tokens" on "public"."organization_eltoque_tokens";

drop policy "Admins can delete ElToque tokens" on "public"."organization_eltoque_tokens";

drop policy "Admins can update ElToque tokens" on "public"."organization_eltoque_tokens";

drop policy "Users can view ElToque tokens" on "public"."organization_eltoque_tokens";

drop policy "Users can view organization settings" on "public"."organization_settings";

drop policy "Admins can manage stores" on "public"."stores";

drop policy "Users can view suppliers" on "public"."suppliers";

drop policy "Users can create consignment documents in their org" on "public"."consignment_documents";

drop policy "Users can update their org's consignment documents" on "public"."consignment_documents";

drop policy "Users can view their org's consignment documents" on "public"."consignment_documents";

drop policy "Users can create consignment payments in their org" on "public"."consignment_payments";

drop policy "Users can view their org's consignment payments" on "public"."consignment_payments";

drop policy "Users can manage consignment" on "public"."consignment_stock";

drop policy "Users can manage customers" on "public"."customers";

drop policy "Admins can create exchange rates" on "public"."exchange_rates";

drop policy "Admins can delete exchange rates" on "public"."exchange_rates";

drop policy "Admins can update exchange rates" on "public"."exchange_rates";

drop policy "Users can view exchange rates" on "public"."exchange_rates";

drop policy "multi_tenant_inventory" on "public"."inventory";

drop policy "multi_tenant_inventory_entries" on "public"."inventory_entries";

drop policy "multi_tenant_inventory_entry_items" on "public"."inventory_entry_items";

drop policy "multi_tenant_inventory_movements" on "public"."inventory_movements";

drop policy "Users can manage invoices" on "public"."invoices";

drop policy "invoices_team_update" on "public"."invoices";

drop policy "Admins can create invitations" on "public"."organization_invitations";

drop policy "Admins can delete invitations" on "public"."organization_invitations";

drop policy "Admins can update invitations" on "public"."organization_invitations";

drop policy "Admins can view organization invitations" on "public"."organization_invitations";

drop policy "Enable delete for organization owners" on "public"."organization_members";

drop policy "Enable insert for authenticated users" on "public"."organization_members";

drop policy "Enable update for organization owners" on "public"."organization_members";

drop policy "Owners can insert organization settings" on "public"."organization_settings";

drop policy "Owners can update organization settings" on "public"."organization_settings";

drop policy "Authenticated users can create organizations" on "public"."organizations";

drop policy "Users can update their organizations" on "public"."organizations";

drop policy "Users can view their organizations" on "public"."organizations";

drop policy "Admins can delete categories" on "public"."product_categories";

drop policy "Users can create categories in their organization" on "public"."product_categories";

drop policy "Users can update categories in their organization" on "public"."product_categories";

drop policy "Users can view categories from their organizations" on "public"."product_categories";

drop policy "Users can create products" on "public"."products";

drop policy "Users can update products" on "public"."products";

drop policy "Users can view products" on "public"."products";

drop policy "Users can insert their own profile" on "public"."profiles";

drop policy "Users can update their own profile" on "public"."profiles";

drop policy "Users can view profiles in their organizations" on "public"."profiles";

drop policy "Users can view stores in their organizations" on "public"."stores";

drop policy "Users can manage suppliers" on "public"."suppliers";

drop policy "team_schedules_org_delete" on "public"."team_schedules";

drop policy "team_schedules_org_insert" on "public"."team_schedules";

drop policy "team_schedules_org_update" on "public"."team_schedules";

drop policy "team_schedules_org_view" on "public"."team_schedules";

drop policy "user_stores_delete_own" on "public"."user_stores";

drop policy "user_stores_insert_own" on "public"."user_stores";

drop policy "user_stores_select_own" on "public"."user_stores";

drop policy "user_stores_update_own" on "public"."user_stores";

alter table "public"."consignment_stock" drop constraint "consignment_stock_created_by_fkey";

alter table "public"."audit_logs" drop constraint "audit_logs_organization_id_fkey";

alter table "public"."cash_movements" drop constraint "cash_movements_currency_id_fkey";

alter table "public"."cash_movements" drop constraint "cash_movements_invoice_id_fkey";

alter table "public"."cash_movements" drop constraint "cash_movements_movement_type_check";

alter table "public"."cash_movements" drop constraint "cash_movements_register_id_fkey";

alter table "public"."cash_registers" drop constraint "cash_registers_organization_id_fkey";

alter table "public"."cash_registers" drop constraint "cash_registers_status_check";

alter table "public"."cash_registers" drop constraint "cash_registers_store_id_fkey";

alter table "public"."cash_registers" drop constraint "cash_registers_user_id_fkey";

alter table "public"."consignment_documents" drop constraint "consignment_documents_consignment_id_fkey";

alter table "public"."consignment_documents" drop constraint "consignment_documents_organization_id_fkey";

alter table "public"."consignment_movements" drop constraint "consignment_movements_consignment_id_fkey";

alter table "public"."consignment_movements" drop constraint "consignment_movements_invoice_id_fkey";

alter table "public"."consignment_payments" drop constraint "consignment_payments_consignment_id_fkey";

alter table "public"."consignment_payments" drop constraint "consignment_payments_organization_id_fkey";

alter table "public"."consignment_payments" drop constraint "consignment_payments_payment_id_fkey";

alter table "public"."consignment_stock" drop constraint "consignment_stock_organization_id_fkey";

alter table "public"."consignment_stock" drop constraint "consignment_stock_product_id_fkey";

alter table "public"."consignment_stock" drop constraint "consignment_stock_store_id_fkey";

alter table "public"."consignment_stock" drop constraint "consignment_stock_variant_id_fkey";

alter table "public"."customer_addresses" drop constraint "customer_addresses_customer_id_fkey";

alter table "public"."customer_contacts" drop constraint "customer_contacts_customer_id_fkey";

alter table "public"."customer_notes" drop constraint "customer_notes_customer_id_fkey";

alter table "public"."customers" drop constraint "customers_organization_id_fkey";

alter table "public"."exchange_rates" drop constraint "exchange_rates_base_currency_id_fkey";

alter table "public"."exchange_rates" drop constraint "exchange_rates_organization_id_fkey";

alter table "public"."exchange_rates" drop constraint "exchange_rates_target_currency_id_fkey";

alter table "public"."inventory" drop constraint "inventory_organization_id_fkey";

alter table "public"."inventory" drop constraint "inventory_product_id_fkey";

alter table "public"."inventory" drop constraint "inventory_store_id_fkey";

alter table "public"."inventory" drop constraint "inventory_variant_id_fkey";

alter table "public"."inventory_entries" drop constraint "inventory_entries_organization_id_fkey";

alter table "public"."inventory_entries" drop constraint "inventory_entries_store_id_fkey";

alter table "public"."inventory_entries" drop constraint "inventory_entries_supplier_id_fkey";

alter table "public"."inventory_entry_items" drop constraint "inventory_entry_items_entry_id_fkey";

alter table "public"."inventory_entry_items" drop constraint "inventory_entry_items_product_id_fkey";

alter table "public"."inventory_entry_items" drop constraint "inventory_entry_items_variant_id_fkey";

alter table "public"."inventory_movements" drop constraint "inventory_movements_organization_id_fkey";

alter table "public"."inventory_movements" drop constraint "inventory_movements_product_id_fkey";

alter table "public"."inventory_movements" drop constraint "inventory_movements_store_id_fkey";

alter table "public"."inventory_movements" drop constraint "inventory_movements_user_id_fkey";

alter table "public"."inventory_movements" drop constraint "inventory_movements_variant_id_fkey";

alter table "public"."invoice_items" drop constraint "invoice_items_invoice_id_fkey";

alter table "public"."invoice_items" drop constraint "invoice_items_product_id_fkey";

alter table "public"."invoice_items" drop constraint "invoice_items_variant_id_fkey";

alter table "public"."invoice_versions" drop constraint "invoice_versions_invoice_id_fkey";

alter table "public"."invoices" drop constraint "invoices_assigned_team_id_fkey";

alter table "public"."invoices" drop constraint "invoices_currency_id_fkey";

alter table "public"."invoices" drop constraint "invoices_customer_id_fkey";

alter table "public"."invoices" drop constraint "invoices_organization_id_fkey";

alter table "public"."invoices" drop constraint "invoices_store_id_fkey";

alter table "public"."offer_items" drop constraint "offer_items_offer_id_fkey";

alter table "public"."offer_items" drop constraint "offer_items_product_id_fkey";

alter table "public"."offer_items" drop constraint "offer_items_variant_id_fkey";

alter table "public"."offer_versions" drop constraint "offer_versions_offer_id_fkey";

alter table "public"."offers" drop constraint "offers_currency_id_fkey";

alter table "public"."offers" drop constraint "offers_customer_id_fkey";

alter table "public"."offers" drop constraint "offers_organization_id_fkey";

alter table "public"."offers" drop constraint "offers_store_id_fkey";

alter table "public"."organization_eltoque_tokens" drop constraint "organization_eltoque_tokens_organization_id_fkey";

alter table "public"."organization_invitations" drop constraint "organization_invitations_organization_id_fkey";

alter table "public"."organization_members" drop constraint "organization_members_organization_id_fkey";

alter table "public"."organization_members" drop constraint "organization_members_user_id_fkey";

alter table "public"."organization_settings" drop constraint "organization_settings_organization_id_fkey";

alter table "public"."payment_schedules" drop constraint "payment_schedules_invoice_id_fkey";

alter table "public"."payments" drop constraint "payments_currency_id_fkey";

alter table "public"."payments" drop constraint "payments_invoice_id_fkey";

alter table "public"."payments" drop constraint "payments_organization_id_fkey";

alter table "public"."payments" drop constraint "payments_supplier_id_fkey";

alter table "public"."pre_invoice_items" drop constraint "pre_invoice_items_pre_invoice_id_fkey";

alter table "public"."pre_invoice_items" drop constraint "pre_invoice_items_product_id_fkey";

alter table "public"."pre_invoice_items" drop constraint "pre_invoice_items_variant_id_fkey";

alter table "public"."pre_invoice_versions" drop constraint "pre_invoice_versions_pre_invoice_id_fkey";

alter table "public"."pre_invoices" drop constraint "pre_invoices_currency_id_fkey";

alter table "public"."pre_invoices" drop constraint "pre_invoices_customer_id_fkey";

alter table "public"."pre_invoices" drop constraint "pre_invoices_organization_id_fkey";

alter table "public"."pre_invoices" drop constraint "pre_invoices_store_id_fkey";

alter table "public"."price_list_items" drop constraint "price_list_items_price_list_id_fkey";

alter table "public"."price_list_items" drop constraint "price_list_items_product_id_fkey";

alter table "public"."price_list_items" drop constraint "price_list_items_variant_id_fkey";

alter table "public"."price_lists" drop constraint "price_lists_organization_id_fkey";

alter table "public"."product_attributes" drop constraint "product_attributes_organization_id_fkey";

alter table "public"."product_categories" drop constraint "product_categories_organization_id_fkey";

alter table "public"."product_categories" drop constraint "product_categories_parent_id_fkey";

alter table "public"."product_variants" drop constraint "product_variants_product_id_fkey";

alter table "public"."products" drop constraint "products_category_id_fkey";

alter table "public"."products" drop constraint "products_organization_id_fkey";

alter table "public"."products" drop constraint "products_store_id_fkey";

alter table "public"."profiles" drop constraint "profiles_organization_id_fkey";

alter table "public"."role_permissions" drop constraint "role_permissions_permission_id_fkey";

alter table "public"."role_permissions" drop constraint "role_permissions_role_id_fkey";

alter table "public"."roles" drop constraint "roles_organization_id_fkey";

alter table "public"."stores" drop constraint "stores_currency_id_fkey";

alter table "public"."stores" drop constraint "stores_organization_id_fkey";

alter table "public"."suppliers" drop constraint "suppliers_organization_id_fkey";

alter table "public"."system_config" drop constraint "system_config_organization_id_fkey";

alter table "public"."team_members" drop constraint "team_members_team_id_fkey";

alter table "public"."team_schedules" drop constraint "team_schedules_invoice_id_fkey";

alter table "public"."team_schedules" drop constraint "team_schedules_organization_id_fkey";

alter table "public"."team_schedules" drop constraint "team_schedules_team_id_fkey";

alter table "public"."teams" drop constraint "teams_organization_id_fkey";

alter table "public"."user_roles" drop constraint "user_roles_organization_id_fkey";

alter table "public"."user_roles" drop constraint "user_roles_role_id_fkey";

alter table "public"."user_stores" drop constraint "user_stores_store_id_fkey";

alter table "public"."work_schedules" drop constraint "work_schedules_customer_id_fkey";

alter table "public"."work_schedules" drop constraint "work_schedules_organization_id_fkey";

alter table "public"."work_schedules" drop constraint "work_schedules_store_id_fkey";

alter table "public"."work_schedules" drop constraint "work_schedules_team_id_fkey";

alter table "public"."work_tasks" drop constraint "work_tasks_schedule_id_fkey";

drop index if exists "public"."idx_audit_logs_created";

drop index if exists "public"."idx_audit_logs_org";

drop index if exists "public"."idx_audit_logs_table";

drop index if exists "public"."idx_cash_registers_open";

drop index if exists "public"."idx_cash_registers_user";

drop index if exists "public"."idx_consignment_created_by";

drop index if exists "public"."idx_consignment_documents_consignment_id";

drop index if exists "public"."idx_consignment_documents_org_status";

drop index if exists "public"."idx_consignment_documents_status";

drop index if exists "public"."idx_consignment_org_created_by";

drop index if exists "public"."idx_consignment_org_store";

drop index if exists "public"."idx_consignment_org_store_status";

drop index if exists "public"."idx_consignment_partner";

drop index if exists "public"."idx_consignment_partner_type";

drop index if exists "public"."idx_consignment_payments_consignment_id";

drop index if exists "public"."idx_consignment_payments_org";

drop index if exists "public"."idx_consignment_payments_payment_id";

drop index if exists "public"."idx_customers_code";

drop index if exists "public"."idx_customers_name_lower";

drop index if exists "public"."idx_customers_org";

drop index if exists "public"."idx_customers_org_active";

drop index if exists "public"."idx_customers_tags_gin";

drop index if exists "public"."idx_customers_tax_id";

drop index if exists "public"."idx_exchange_rates_latest";

drop index if exists "public"."idx_exchange_rates_lookup";

drop index if exists "public"."idx_inventory_movements_org_store_date";

drop index if exists "public"."idx_inventory_movements_product_date";

drop index if exists "public"."idx_inventory_movements_type";

drop index if exists "public"."idx_inventory_org_store";

drop index if exists "public"."idx_inventory_product";

drop index if exists "public"."idx_invitations_email";

drop index if exists "public"."idx_invitations_org";

drop index if exists "public"."idx_invitations_status";

drop index if exists "public"."idx_invitations_token";

drop index if exists "public"."idx_invoices_customer";

drop index if exists "public"."idx_invoices_number_lower";

drop index if exists "public"."idx_invoices_org_payment_status";

drop index if exists "public"."idx_invoices_org_store";

drop index if exists "public"."idx_invoices_org_store_status";

drop index if exists "public"."idx_invoices_overdue";

drop index if exists "public"."idx_offers_active";

drop index if exists "public"."idx_offers_customer";

drop index if exists "public"."idx_offers_org_store";

drop index if exists "public"."idx_offers_org_store_status";

drop index if exists "public"."idx_org_eltoque_organization_id";

drop index if exists "public"."idx_organization_members_user";

drop index if exists "public"."idx_organizations_slug";

drop index if exists "public"."idx_payments_invoice";

drop index if exists "public"."idx_payments_org_date";

drop index if exists "public"."idx_payments_source";

drop index if exists "public"."idx_pre_invoices_org_store_status";

drop index if exists "public"."idx_product_categories_level";

drop index if exists "public"."idx_product_categories_org_id";

drop index if exists "public"."idx_product_categories_parent";

drop index if exists "public"."idx_product_categories_parent_id";

drop index if exists "public"."idx_products_barcode";

drop index if exists "public"."idx_products_category";

drop index if exists "public"."idx_products_has_variants";

drop index if exists "public"."idx_products_name_lower";

drop index if exists "public"."idx_products_org";

drop index if exists "public"."idx_products_org_store_active";

drop index if exists "public"."idx_products_sku_lower";

drop index if exists "public"."idx_profiles_org";

drop index if exists "public"."idx_stores_org";

drop index if exists "public"."idx_suppliers_name_lower";

drop index if exists "public"."idx_suppliers_org_active";

drop index if exists "public"."idx_suppliers_tags_gin";

drop index if exists "public"."idx_user_stores_default";

drop index if exists "public"."idx_user_stores_pos_access";

drop index if exists "public"."idx_work_schedules_date_status";

drop index if exists "public"."idx_work_schedules_team";

drop index if exists "public"."inventory_entries_org_store_date_idx";

drop index if exists "public"."inventory_entries_org_store_status_idx";

drop index if exists "public"."inventory_entry_items_entry_id_idx";

drop index if exists "public"."inventory_entry_items_product_id_idx";


  create table "public"."cash_register_sessions" (
    "id" uuid not null default gen_random_uuid(),
    "organization_id" uuid,
    "store_id" uuid,
    "user_id" uuid,
    "status" character varying(20) default 'open'::character varying,
    "opening_balance" numeric(15,2) default 0,
    "closing_balance" numeric(15,2),
    "expected_balance" numeric(15,2),
    "notes" text,
    "opened_at" timestamp with time zone default now(),
    "closed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."cash_register_sessions" enable row level security;

alter table "public"."cash_movements" add column "currency" character varying(10) default 'CUP'::character varying;

alter table "public"."cash_movements" add column "user_id" uuid;

alter table "public"."consignment_documents" alter column "created_by" set default auth.uid();

alter table "public"."consignment_payments" alter column "created_by" set default auth.uid();

alter table "public"."consignment_stock" drop column "created_by";

alter table "public"."consignment_stock" add column "customer_id" uuid;

alter table "public"."consignment_stock" add column "supplier_id" uuid;

alter table "public"."customers" add column "notes" text;

alter table "public"."inventory" add column "available" numeric(15,3) generated always as ((quantity - COALESCE(reserved_quantity, (0)::numeric))) stored;

alter table "public"."inventory_entries" alter column "created_by" set default auth.uid();

alter table "public"."invoices" alter column "created_by" set default auth.uid();

alter table "public"."offers" alter column "created_by" set default auth.uid();

alter table "public"."organization_members" add column "created_at" timestamp with time zone not null default now();

alter table "public"."organization_members" add column "id" uuid not null default gen_random_uuid();

alter table "public"."organization_members" add column "role_id" uuid;

alter table "public"."organizations" add column "address" text;

alter table "public"."organizations" add column "email" text;

alter table "public"."organizations" add column "phone" text;

alter table "public"."payments" alter column "created_by" set default auth.uid();

alter table "public"."pre_invoices" alter column "created_by" set default auth.uid();

alter table "public"."products" alter column "created_by" set default auth.uid();

alter table "public"."profiles" add column "email" text;

alter table "public"."suppliers" add column "notes" text;

alter table "public"."work_schedules" alter column "created_by" set default auth.uid();

CREATE UNIQUE INDEX cash_register_sessions_pkey ON public.cash_register_sessions USING btree (id);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs USING btree (user_id);

CREATE INDEX idx_cash_movements_currency_id ON public.cash_movements USING btree (currency_id);

CREATE INDEX idx_cash_movements_invoice_id ON public.cash_movements USING btree (invoice_id);

CREATE INDEX idx_cash_movements_user_id ON public.cash_movements USING btree (user_id);

CREATE INDEX idx_cash_sessions_org_user ON public.cash_register_sessions USING btree (organization_id, user_id, status);

CREATE INDEX idx_cash_sessions_org_user_status ON public.cash_register_sessions USING btree (organization_id, user_id, status);

CREATE INDEX idx_consignment_documents_created_by ON public.consignment_documents USING btree (created_by);

CREATE INDEX idx_consignment_documents_provider_signed_by ON public.consignment_documents USING btree (provider_signed_by);

CREATE INDEX idx_consignment_documents_receiver_signed_by ON public.consignment_documents USING btree (receiver_signed_by);

CREATE INDEX idx_consignment_documents_rejected_by ON public.consignment_documents USING btree (rejected_by);

CREATE INDEX idx_consignment_movements_consignment_id ON public.consignment_movements USING btree (consignment_id);

CREATE INDEX idx_consignment_movements_invoice_id ON public.consignment_movements USING btree (invoice_id);

CREATE INDEX idx_consignment_payments_created_by ON public.consignment_payments USING btree (created_by);

CREATE INDEX idx_consignment_stock_customer_id ON public.consignment_stock USING btree (customer_id);

CREATE INDEX idx_consignment_stock_product_id ON public.consignment_stock USING btree (product_id);

CREATE INDEX idx_consignment_stock_store_id ON public.consignment_stock USING btree (store_id);

CREATE INDEX idx_consignment_stock_supplier_id ON public.consignment_stock USING btree (supplier_id);

CREATE INDEX idx_consignment_stock_variant_id ON public.consignment_stock USING btree (variant_id);

CREATE INDEX idx_customer_addresses_customer_id ON public.customer_addresses USING btree (customer_id);

CREATE INDEX idx_customer_contacts_customer_id ON public.customer_contacts USING btree (customer_id);

CREATE INDEX idx_customer_notes_customer_id ON public.customer_notes USING btree (customer_id);

CREATE INDEX idx_customer_notes_user_id ON public.customer_notes USING btree (user_id);

CREATE INDEX idx_exchange_rates_target_currency_id ON public.exchange_rates USING btree (target_currency_id);

CREATE INDEX idx_inventory_entries_store_id ON public.inventory_entries USING btree (store_id);

CREATE INDEX idx_inventory_entries_supplier_id ON public.inventory_entries USING btree (supplier_id);

CREATE INDEX idx_inventory_entry_items_variant_id ON public.inventory_entry_items USING btree (variant_id);

CREATE INDEX idx_inventory_movements_store_id ON public.inventory_movements USING btree (store_id);

CREATE INDEX idx_inventory_movements_user_id ON public.inventory_movements USING btree (user_id);

CREATE INDEX idx_inventory_movements_variant_id ON public.inventory_movements USING btree (variant_id);

CREATE INDEX idx_inventory_store_id ON public.inventory USING btree (store_id);

CREATE INDEX idx_inventory_variant_id ON public.inventory USING btree (variant_id);

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items USING btree (invoice_id);

CREATE INDEX idx_invoice_items_product_id ON public.invoice_items USING btree (product_id);

CREATE INDEX idx_invoice_items_variant_id ON public.invoice_items USING btree (variant_id);

CREATE INDEX idx_invoice_versions_changed_by ON public.invoice_versions USING btree (changed_by);

CREATE INDEX idx_invoice_versions_invoice_id ON public.invoice_versions USING btree (invoice_id);

CREATE INDEX idx_invoices_approved_by ON public.invoices USING btree (approved_by);

CREATE INDEX idx_invoices_created_by ON public.invoices USING btree (created_by);

CREATE INDEX idx_invoices_currency_id ON public.invoices USING btree (currency_id);

CREATE INDEX idx_invoices_store_id ON public.invoices USING btree (store_id);

CREATE INDEX idx_offer_items_offer_id ON public.offer_items USING btree (offer_id);

CREATE INDEX idx_offer_items_product_id ON public.offer_items USING btree (product_id);

CREATE INDEX idx_offer_items_variant_id ON public.offer_items USING btree (variant_id);

CREATE INDEX idx_offer_versions_changed_by ON public.offer_versions USING btree (changed_by);

CREATE INDEX idx_offer_versions_offer_id ON public.offer_versions USING btree (offer_id);

CREATE INDEX idx_offers_approved_by ON public.offers USING btree (approved_by);

CREATE INDEX idx_offers_created_by ON public.offers USING btree (created_by);

CREATE INDEX idx_offers_currency_id ON public.offers USING btree (currency_id);

CREATE INDEX idx_offers_store_id ON public.offers USING btree (store_id);

CREATE INDEX idx_organization_invitations_invited_by ON public.organization_invitations USING btree (invited_by);

CREATE INDEX idx_organization_members_invited_by ON public.organization_members USING btree (invited_by);

CREATE INDEX idx_organization_members_role_id ON public.organization_members USING btree (role_id);

CREATE INDEX idx_payment_schedules_invoice_id ON public.payment_schedules USING btree (invoice_id);

CREATE INDEX idx_payments_created_by ON public.payments USING btree (created_by);

CREATE INDEX idx_payments_currency_id ON public.payments USING btree (currency_id);

CREATE INDEX idx_payments_supplier_id ON public.payments USING btree (supplier_id);

CREATE INDEX idx_pre_invoice_items_pre_invoice_id ON public.pre_invoice_items USING btree (pre_invoice_id);

CREATE INDEX idx_pre_invoice_items_product_id ON public.pre_invoice_items USING btree (product_id);

CREATE INDEX idx_pre_invoice_items_variant_id ON public.pre_invoice_items USING btree (variant_id);

CREATE INDEX idx_pre_invoice_versions_changed_by ON public.pre_invoice_versions USING btree (changed_by);

CREATE INDEX idx_pre_invoice_versions_pre_invoice_id ON public.pre_invoice_versions USING btree (pre_invoice_id);

CREATE INDEX idx_pre_invoices_approved_by ON public.pre_invoices USING btree (approved_by);

CREATE INDEX idx_pre_invoices_created_by ON public.pre_invoices USING btree (created_by);

CREATE INDEX idx_pre_invoices_currency_id ON public.pre_invoices USING btree (currency_id);

CREATE INDEX idx_pre_invoices_customer_id ON public.pre_invoices USING btree (customer_id);

CREATE INDEX idx_pre_invoices_store_id ON public.pre_invoices USING btree (store_id);

CREATE INDEX idx_price_list_items_product_id ON public.price_list_items USING btree (product_id);

CREATE INDEX idx_price_list_items_variant_id ON public.price_list_items USING btree (variant_id);

CREATE INDEX idx_price_lists_organization_id ON public.price_lists USING btree (organization_id);

CREATE INDEX idx_product_attributes_organization_id ON public.product_attributes USING btree (organization_id);

CREATE INDEX idx_products_created_by ON public.products USING btree (created_by);

CREATE INDEX idx_products_store_id ON public.products USING btree (store_id);

CREATE INDEX idx_role_permissions_permission_id ON public.role_permissions USING btree (permission_id);

CREATE INDEX idx_stores_currency_id ON public.stores USING btree (currency_id);

CREATE INDEX idx_system_config_updated_by ON public.system_config USING btree (updated_by);

CREATE INDEX idx_team_members_user_id ON public.team_members USING btree (user_id);

CREATE INDEX idx_teams_organization_id ON public.teams USING btree (organization_id);

CREATE INDEX idx_user_roles_organization_id ON public.user_roles USING btree (organization_id);

CREATE INDEX idx_user_roles_role_id ON public.user_roles USING btree (role_id);

CREATE INDEX idx_work_schedules_created_by ON public.work_schedules USING btree (created_by);

CREATE INDEX idx_work_schedules_customer_id ON public.work_schedules USING btree (customer_id);

CREATE INDEX idx_work_schedules_store_id ON public.work_schedules USING btree (store_id);

CREATE INDEX idx_work_tasks_assigned_to ON public.work_tasks USING btree (assigned_to);

CREATE INDEX idx_work_tasks_schedule_id ON public.work_tasks USING btree (schedule_id);

CREATE UNIQUE INDEX organization_members_id_key ON public.organization_members USING btree (id);

alter table "public"."cash_register_sessions" add constraint "cash_register_sessions_pkey" PRIMARY KEY using index "cash_register_sessions_pkey";

alter table "public"."cash_movements" add constraint "cash_movements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."cash_movements" validate constraint "cash_movements_user_id_fkey";

alter table "public"."cash_register_sessions" add constraint "cash_register_sessions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."cash_register_sessions" validate constraint "cash_register_sessions_organization_id_fkey";

alter table "public"."cash_register_sessions" add constraint "cash_register_sessions_status_check" CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'closed'::character varying, 'cancelled'::character varying])::text[]))) not valid;

alter table "public"."cash_register_sessions" validate constraint "cash_register_sessions_status_check";

alter table "public"."cash_register_sessions" add constraint "cash_register_sessions_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE not valid;

alter table "public"."cash_register_sessions" validate constraint "cash_register_sessions_store_id_fkey";

alter table "public"."cash_register_sessions" add constraint "cash_register_sessions_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."cash_register_sessions" validate constraint "cash_register_sessions_user_id_fkey";

alter table "public"."consignment_stock" add constraint "consignment_stock_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL not valid;

alter table "public"."consignment_stock" validate constraint "consignment_stock_customer_id_fkey";

alter table "public"."consignment_stock" add constraint "consignment_stock_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL not valid;

alter table "public"."consignment_stock" validate constraint "consignment_stock_supplier_id_fkey";

alter table "public"."organization_members" add constraint "organization_members_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE SET NULL not valid;

alter table "public"."organization_members" validate constraint "organization_members_role_id_fkey";

alter table "public"."audit_logs" add constraint "audit_logs_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."audit_logs" validate constraint "audit_logs_organization_id_fkey";

alter table "public"."cash_movements" add constraint "cash_movements_currency_id_fkey" FOREIGN KEY (currency_id) REFERENCES public.currencies(id) not valid;

alter table "public"."cash_movements" validate constraint "cash_movements_currency_id_fkey";

alter table "public"."cash_movements" add constraint "cash_movements_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) not valid;

alter table "public"."cash_movements" validate constraint "cash_movements_invoice_id_fkey";

alter table "public"."cash_movements" add constraint "cash_movements_movement_type_check" CHECK (((movement_type)::text = ANY ((ARRAY['INCOME'::character varying, 'EXPENSE'::character varying, 'WITHDRAWAL'::character varying, 'DEPOSIT'::character varying, 'ADJUSTMENT'::character varying])::text[]))) not valid;

alter table "public"."cash_movements" validate constraint "cash_movements_movement_type_check";

alter table "public"."cash_movements" add constraint "cash_movements_register_id_fkey" FOREIGN KEY (register_id) REFERENCES public.cash_registers(id) ON DELETE CASCADE not valid;

alter table "public"."cash_movements" validate constraint "cash_movements_register_id_fkey";

alter table "public"."cash_registers" add constraint "cash_registers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."cash_registers" validate constraint "cash_registers_organization_id_fkey";

alter table "public"."cash_registers" add constraint "cash_registers_status_check" CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'CLOSED'::character varying, 'SUSPENDED'::character varying])::text[]))) not valid;

alter table "public"."cash_registers" validate constraint "cash_registers_status_check";

alter table "public"."cash_registers" add constraint "cash_registers_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE not valid;

alter table "public"."cash_registers" validate constraint "cash_registers_store_id_fkey";

alter table "public"."cash_registers" add constraint "cash_registers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."cash_registers" validate constraint "cash_registers_user_id_fkey";

alter table "public"."consignment_documents" add constraint "consignment_documents_consignment_id_fkey" FOREIGN KEY (consignment_id) REFERENCES public.consignment_stock(id) ON DELETE CASCADE not valid;

alter table "public"."consignment_documents" validate constraint "consignment_documents_consignment_id_fkey";

alter table "public"."consignment_documents" add constraint "consignment_documents_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."consignment_documents" validate constraint "consignment_documents_organization_id_fkey";

alter table "public"."consignment_movements" add constraint "consignment_movements_consignment_id_fkey" FOREIGN KEY (consignment_id) REFERENCES public.consignment_stock(id) ON DELETE CASCADE not valid;

alter table "public"."consignment_movements" validate constraint "consignment_movements_consignment_id_fkey";

alter table "public"."consignment_movements" add constraint "consignment_movements_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) not valid;

alter table "public"."consignment_movements" validate constraint "consignment_movements_invoice_id_fkey";

alter table "public"."consignment_payments" add constraint "consignment_payments_consignment_id_fkey" FOREIGN KEY (consignment_id) REFERENCES public.consignment_stock(id) ON DELETE CASCADE not valid;

alter table "public"."consignment_payments" validate constraint "consignment_payments_consignment_id_fkey";

alter table "public"."consignment_payments" add constraint "consignment_payments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."consignment_payments" validate constraint "consignment_payments_organization_id_fkey";

alter table "public"."consignment_payments" add constraint "consignment_payments_payment_id_fkey" FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE not valid;

alter table "public"."consignment_payments" validate constraint "consignment_payments_payment_id_fkey";

alter table "public"."consignment_stock" add constraint "consignment_stock_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."consignment_stock" validate constraint "consignment_stock_organization_id_fkey";

alter table "public"."consignment_stock" add constraint "consignment_stock_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."consignment_stock" validate constraint "consignment_stock_product_id_fkey";

alter table "public"."consignment_stock" add constraint "consignment_stock_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE not valid;

alter table "public"."consignment_stock" validate constraint "consignment_stock_store_id_fkey";

alter table "public"."consignment_stock" add constraint "consignment_stock_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE not valid;

alter table "public"."consignment_stock" validate constraint "consignment_stock_variant_id_fkey";

alter table "public"."customer_addresses" add constraint "customer_addresses_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE not valid;

alter table "public"."customer_addresses" validate constraint "customer_addresses_customer_id_fkey";

alter table "public"."customer_contacts" add constraint "customer_contacts_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE not valid;

alter table "public"."customer_contacts" validate constraint "customer_contacts_customer_id_fkey";

alter table "public"."customer_notes" add constraint "customer_notes_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE not valid;

alter table "public"."customer_notes" validate constraint "customer_notes_customer_id_fkey";

alter table "public"."customers" add constraint "customers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."customers" validate constraint "customers_organization_id_fkey";

alter table "public"."exchange_rates" add constraint "exchange_rates_base_currency_id_fkey" FOREIGN KEY (base_currency_id) REFERENCES public.currencies(id) not valid;

alter table "public"."exchange_rates" validate constraint "exchange_rates_base_currency_id_fkey";

alter table "public"."exchange_rates" add constraint "exchange_rates_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."exchange_rates" validate constraint "exchange_rates_organization_id_fkey";

alter table "public"."exchange_rates" add constraint "exchange_rates_target_currency_id_fkey" FOREIGN KEY (target_currency_id) REFERENCES public.currencies(id) not valid;

alter table "public"."exchange_rates" validate constraint "exchange_rates_target_currency_id_fkey";

alter table "public"."inventory" add constraint "inventory_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."inventory" validate constraint "inventory_organization_id_fkey";

alter table "public"."inventory" add constraint "inventory_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."inventory" validate constraint "inventory_product_id_fkey";

alter table "public"."inventory" add constraint "inventory_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE not valid;

alter table "public"."inventory" validate constraint "inventory_store_id_fkey";

alter table "public"."inventory" add constraint "inventory_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE not valid;

alter table "public"."inventory" validate constraint "inventory_variant_id_fkey";

alter table "public"."inventory_entries" add constraint "inventory_entries_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."inventory_entries" validate constraint "inventory_entries_organization_id_fkey";

alter table "public"."inventory_entries" add constraint "inventory_entries_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE not valid;

alter table "public"."inventory_entries" validate constraint "inventory_entries_store_id_fkey";

alter table "public"."inventory_entries" add constraint "inventory_entries_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL not valid;

alter table "public"."inventory_entries" validate constraint "inventory_entries_supplier_id_fkey";

alter table "public"."inventory_entry_items" add constraint "inventory_entry_items_entry_id_fkey" FOREIGN KEY (entry_id) REFERENCES public.inventory_entries(id) ON DELETE CASCADE not valid;

alter table "public"."inventory_entry_items" validate constraint "inventory_entry_items_entry_id_fkey";

alter table "public"."inventory_entry_items" add constraint "inventory_entry_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT not valid;

alter table "public"."inventory_entry_items" validate constraint "inventory_entry_items_product_id_fkey";

alter table "public"."inventory_entry_items" add constraint "inventory_entry_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL not valid;

alter table "public"."inventory_entry_items" validate constraint "inventory_entry_items_variant_id_fkey";

alter table "public"."inventory_movements" add constraint "inventory_movements_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."inventory_movements" validate constraint "inventory_movements_organization_id_fkey";

alter table "public"."inventory_movements" add constraint "inventory_movements_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."inventory_movements" validate constraint "inventory_movements_product_id_fkey";

alter table "public"."inventory_movements" add constraint "inventory_movements_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE not valid;

alter table "public"."inventory_movements" validate constraint "inventory_movements_store_id_fkey";

alter table "public"."inventory_movements" add constraint "inventory_movements_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."inventory_movements" validate constraint "inventory_movements_user_id_fkey";

alter table "public"."inventory_movements" add constraint "inventory_movements_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL not valid;

alter table "public"."inventory_movements" validate constraint "inventory_movements_variant_id_fkey";

alter table "public"."invoice_items" add constraint "invoice_items_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_items" validate constraint "invoice_items_invoice_id_fkey";

alter table "public"."invoice_items" add constraint "invoice_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."invoice_items" validate constraint "invoice_items_product_id_fkey";

alter table "public"."invoice_items" add constraint "invoice_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL not valid;

alter table "public"."invoice_items" validate constraint "invoice_items_variant_id_fkey";

alter table "public"."invoice_versions" add constraint "invoice_versions_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE not valid;

alter table "public"."invoice_versions" validate constraint "invoice_versions_invoice_id_fkey";

alter table "public"."invoices" add constraint "invoices_assigned_team_id_fkey" FOREIGN KEY (assigned_team_id) REFERENCES public.teams(id) not valid;

alter table "public"."invoices" validate constraint "invoices_assigned_team_id_fkey";

alter table "public"."invoices" add constraint "invoices_currency_id_fkey" FOREIGN KEY (currency_id) REFERENCES public.currencies(id) not valid;

alter table "public"."invoices" validate constraint "invoices_currency_id_fkey";

alter table "public"."invoices" add constraint "invoices_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL not valid;

alter table "public"."invoices" validate constraint "invoices_customer_id_fkey";

alter table "public"."invoices" add constraint "invoices_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."invoices" validate constraint "invoices_organization_id_fkey";

alter table "public"."invoices" add constraint "invoices_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE not valid;

alter table "public"."invoices" validate constraint "invoices_store_id_fkey";

alter table "public"."offer_items" add constraint "offer_items_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE not valid;

alter table "public"."offer_items" validate constraint "offer_items_offer_id_fkey";

alter table "public"."offer_items" add constraint "offer_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."offer_items" validate constraint "offer_items_product_id_fkey";

alter table "public"."offer_items" add constraint "offer_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL not valid;

alter table "public"."offer_items" validate constraint "offer_items_variant_id_fkey";

alter table "public"."offer_versions" add constraint "offer_versions_offer_id_fkey" FOREIGN KEY (offer_id) REFERENCES public.offers(id) ON DELETE CASCADE not valid;

alter table "public"."offer_versions" validate constraint "offer_versions_offer_id_fkey";

alter table "public"."offers" add constraint "offers_currency_id_fkey" FOREIGN KEY (currency_id) REFERENCES public.currencies(id) not valid;

alter table "public"."offers" validate constraint "offers_currency_id_fkey";

alter table "public"."offers" add constraint "offers_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL not valid;

alter table "public"."offers" validate constraint "offers_customer_id_fkey";

alter table "public"."offers" add constraint "offers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."offers" validate constraint "offers_organization_id_fkey";

alter table "public"."offers" add constraint "offers_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE not valid;

alter table "public"."offers" validate constraint "offers_store_id_fkey";

alter table "public"."organization_eltoque_tokens" add constraint "organization_eltoque_tokens_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_eltoque_tokens" validate constraint "organization_eltoque_tokens_organization_id_fkey";

alter table "public"."organization_invitations" add constraint "organization_invitations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_invitations" validate constraint "organization_invitations_organization_id_fkey";

alter table "public"."organization_members" add constraint "organization_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_members" validate constraint "organization_members_organization_id_fkey";

alter table "public"."organization_members" add constraint "organization_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."organization_members" validate constraint "organization_members_user_id_fkey";

alter table "public"."organization_settings" add constraint "organization_settings_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."organization_settings" validate constraint "organization_settings_organization_id_fkey";

alter table "public"."payment_schedules" add constraint "payment_schedules_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE not valid;

alter table "public"."payment_schedules" validate constraint "payment_schedules_invoice_id_fkey";

alter table "public"."payments" add constraint "payments_currency_id_fkey" FOREIGN KEY (currency_id) REFERENCES public.currencies(id) not valid;

alter table "public"."payments" validate constraint "payments_currency_id_fkey";

alter table "public"."payments" add constraint "payments_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_invoice_id_fkey";

alter table "public"."payments" add constraint "payments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."payments" validate constraint "payments_organization_id_fkey";

alter table "public"."payments" add constraint "payments_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL not valid;

alter table "public"."payments" validate constraint "payments_supplier_id_fkey";

alter table "public"."pre_invoice_items" add constraint "pre_invoice_items_pre_invoice_id_fkey" FOREIGN KEY (pre_invoice_id) REFERENCES public.pre_invoices(id) ON DELETE CASCADE not valid;

alter table "public"."pre_invoice_items" validate constraint "pre_invoice_items_pre_invoice_id_fkey";

alter table "public"."pre_invoice_items" add constraint "pre_invoice_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."pre_invoice_items" validate constraint "pre_invoice_items_product_id_fkey";

alter table "public"."pre_invoice_items" add constraint "pre_invoice_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL not valid;

alter table "public"."pre_invoice_items" validate constraint "pre_invoice_items_variant_id_fkey";

alter table "public"."pre_invoice_versions" add constraint "pre_invoice_versions_pre_invoice_id_fkey" FOREIGN KEY (pre_invoice_id) REFERENCES public.pre_invoices(id) ON DELETE CASCADE not valid;

alter table "public"."pre_invoice_versions" validate constraint "pre_invoice_versions_pre_invoice_id_fkey";

alter table "public"."pre_invoices" add constraint "pre_invoices_currency_id_fkey" FOREIGN KEY (currency_id) REFERENCES public.currencies(id) not valid;

alter table "public"."pre_invoices" validate constraint "pre_invoices_currency_id_fkey";

alter table "public"."pre_invoices" add constraint "pre_invoices_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL not valid;

alter table "public"."pre_invoices" validate constraint "pre_invoices_customer_id_fkey";

alter table "public"."pre_invoices" add constraint "pre_invoices_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."pre_invoices" validate constraint "pre_invoices_organization_id_fkey";

alter table "public"."pre_invoices" add constraint "pre_invoices_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE not valid;

alter table "public"."pre_invoices" validate constraint "pre_invoices_store_id_fkey";

alter table "public"."price_list_items" add constraint "price_list_items_price_list_id_fkey" FOREIGN KEY (price_list_id) REFERENCES public.price_lists(id) ON DELETE CASCADE not valid;

alter table "public"."price_list_items" validate constraint "price_list_items_price_list_id_fkey";

alter table "public"."price_list_items" add constraint "price_list_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."price_list_items" validate constraint "price_list_items_product_id_fkey";

alter table "public"."price_list_items" add constraint "price_list_items_variant_id_fkey" FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE not valid;

alter table "public"."price_list_items" validate constraint "price_list_items_variant_id_fkey";

alter table "public"."price_lists" add constraint "price_lists_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."price_lists" validate constraint "price_lists_organization_id_fkey";

alter table "public"."product_attributes" add constraint "product_attributes_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."product_attributes" validate constraint "product_attributes_organization_id_fkey";

alter table "public"."product_categories" add constraint "product_categories_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."product_categories" validate constraint "product_categories_organization_id_fkey";

alter table "public"."product_categories" add constraint "product_categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES public.product_categories(id) ON DELETE SET NULL not valid;

alter table "public"."product_categories" validate constraint "product_categories_parent_id_fkey";

alter table "public"."product_variants" add constraint "product_variants_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_variants" validate constraint "product_variants_product_id_fkey";

alter table "public"."products" add constraint "products_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.product_categories(id) ON DELETE SET NULL not valid;

alter table "public"."products" validate constraint "products_category_id_fkey";

alter table "public"."products" add constraint "products_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."products" validate constraint "products_organization_id_fkey";

alter table "public"."products" add constraint "products_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL not valid;

alter table "public"."products" validate constraint "products_store_id_fkey";

alter table "public"."profiles" add constraint "profiles_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_organization_id_fkey";

alter table "public"."role_permissions" add constraint "role_permissions_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE not valid;

alter table "public"."role_permissions" validate constraint "role_permissions_permission_id_fkey";

alter table "public"."role_permissions" add constraint "role_permissions_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE not valid;

alter table "public"."role_permissions" validate constraint "role_permissions_role_id_fkey";

alter table "public"."roles" add constraint "roles_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."roles" validate constraint "roles_organization_id_fkey";

alter table "public"."stores" add constraint "stores_currency_id_fkey" FOREIGN KEY (currency_id) REFERENCES public.currencies(id) not valid;

alter table "public"."stores" validate constraint "stores_currency_id_fkey";

alter table "public"."stores" add constraint "stores_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."stores" validate constraint "stores_organization_id_fkey";

alter table "public"."suppliers" add constraint "suppliers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."suppliers" validate constraint "suppliers_organization_id_fkey";

alter table "public"."system_config" add constraint "system_config_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."system_config" validate constraint "system_config_organization_id_fkey";

alter table "public"."team_members" add constraint "team_members_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE not valid;

alter table "public"."team_members" validate constraint "team_members_team_id_fkey";

alter table "public"."team_schedules" add constraint "team_schedules_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE not valid;

alter table "public"."team_schedules" validate constraint "team_schedules_invoice_id_fkey";

alter table "public"."team_schedules" add constraint "team_schedules_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."team_schedules" validate constraint "team_schedules_organization_id_fkey";

alter table "public"."team_schedules" add constraint "team_schedules_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE not valid;

alter table "public"."team_schedules" validate constraint "team_schedules_team_id_fkey";

alter table "public"."teams" add constraint "teams_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."teams" validate constraint "teams_organization_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_organization_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_id_fkey";

alter table "public"."user_stores" add constraint "user_stores_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE not valid;

alter table "public"."user_stores" validate constraint "user_stores_store_id_fkey";

alter table "public"."work_schedules" add constraint "work_schedules_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id) not valid;

alter table "public"."work_schedules" validate constraint "work_schedules_customer_id_fkey";

alter table "public"."work_schedules" add constraint "work_schedules_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE not valid;

alter table "public"."work_schedules" validate constraint "work_schedules_organization_id_fkey";

alter table "public"."work_schedules" add constraint "work_schedules_store_id_fkey" FOREIGN KEY (store_id) REFERENCES public.stores(id) not valid;

alter table "public"."work_schedules" validate constraint "work_schedules_store_id_fkey";

alter table "public"."work_schedules" add constraint "work_schedules_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE CASCADE not valid;

alter table "public"."work_schedules" validate constraint "work_schedules_team_id_fkey";

alter table "public"."work_tasks" add constraint "work_tasks_schedule_id_fkey" FOREIGN KEY (schedule_id) REFERENCES public.work_schedules(id) ON DELETE CASCADE not valid;

alter table "public"."work_tasks" validate constraint "work_tasks_schedule_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_inventory_movement(p_organization_id uuid, p_store_id uuid, p_product_id uuid, p_variant_id uuid, p_movement_type character varying, p_quantity numeric, p_cost numeric, p_reference_type character varying, p_reference_id uuid, p_notes text, p_user_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_movement_id UUID;
    v_current_stock NUMERIC(15, 3);
    v_stock_change NUMERIC(15, 3);
BEGIN
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser mayor a 0';
    END IF;

    CASE p_movement_type
        WHEN 'ENTRADA_COMPRA', 'ENTRADA_DEVOLUCION', 'ENTRADA_CONSIGNACION', 'ENTRADA_AJUSTE', 'ENTRADA_INICIAL' THEN
            v_stock_change := p_quantity;
        WHEN 'SALIDA_VENTA', 'SALIDA_DEVOLUCION_PROVEEDOR', 'SALIDA_CONSIGNACION', 'SALIDA_AJUSTE' THEN
            v_stock_change := -p_quantity;
        ELSE
            RAISE EXCEPTION 'Tipo de movimiento desconocido: %', p_movement_type;
    END CASE;

    SELECT COALESCE(quantity, 0) INTO v_current_stock
    FROM public.inventory
    WHERE organization_id = p_organization_id
      AND store_id = p_store_id
      AND product_id = p_product_id
      AND COALESCE(variant_id::text, '') = COALESCE(p_variant_id::text, '');

    v_current_stock := COALESCE(v_current_stock, 0);

    IF v_stock_change < 0 AND (v_current_stock + v_stock_change) < 0 THEN
        RAISE EXCEPTION 'Stock insuficiente. Stock actual: %', v_current_stock;
    END IF;

    INSERT INTO public.inventory_movements (
        organization_id, store_id, product_id, variant_id,
        movement_type, quantity, cost, reference_type,
        reference_id, notes, user_id, created_at
    ) VALUES (
        p_organization_id, p_store_id, p_product_id, p_variant_id,
        p_movement_type, p_quantity, p_cost, p_reference_type,
        p_reference_id, p_notes, p_user_id, NOW()
    )
    RETURNING id INTO v_movement_id;

    INSERT INTO public.inventory (organization_id, store_id, product_id, variant_id, quantity, updated_at)
    VALUES (p_organization_id, p_store_id, p_product_id, p_variant_id, v_stock_change, NOW())
    ON CONFLICT (organization_id, product_id, variant_id, store_id)
    DO UPDATE SET
        quantity = inventory.quantity + v_stock_change,
        updated_at = NOW();

    RETURN v_movement_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission text, p_scope text DEFAULT 'organization'::text, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE v_has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = (SELECT auth.uid())
          AND p.module || '.' || p.action = p_permission
          AND (p_scope = 'organization' OR (p_scope = 'store' AND ur.store_id = p_store_id) OR p_scope = 'own')
    ) INTO v_has_permission;
    RETURN v_has_permission;
END;
$function$
;

create or replace view "public"."audit_retention_stats" as  SELECT count(*) AS total_records,
    count(*) FILTER (WHERE (created_at >= (now() - '30 days'::interval))) AS last_30_days,
    count(*) FILTER (WHERE (created_at >= (now() - '90 days'::interval))) AS last_90_days,
    count(*) FILTER (WHERE (created_at >= (now() - '1 year'::interval))) AS last_year,
    count(*) FILTER (WHERE (created_at < (now() - '2 years'::interval))) AS older_than_2_years,
    min(created_at) AS oldest_record,
    max(created_at) AS newest_record,
    pg_size_pretty(pg_total_relation_size('public.audit_logs'::regclass)) AS table_size
   FROM public.audit_logs;


CREATE OR REPLACE FUNCTION public.capture_audit_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    audit_row audit_logs%ROWTYPE;
    current_user_id TEXT;
    client_ip TEXT;
    client_ua TEXT;
BEGIN
    current_user_id := COALESCE(
        (SELECT raw_user_meta_data->>'id' FROM auth.users WHERE id = auth.uid()),
        auth.uid()::TEXT
    );

    client_ip := COALESCE(
        current_setting('request.headers', true)::JSON->>'x-forwarded-for',
        current_setting('request.headers', true)::JSON->>'cf-connecting-ip'
    );

    client_ua := current_setting('request.headers', true)::JSON->>'user-agent';

    IF TG_OP = 'INSERT' THEN
        audit_row.action := 'INSERT';
        audit_row.new_data := row_to_json(NEW);
        audit_row.old_data := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        audit_row.action := 'UPDATE';
        audit_row.new_data := row_to_json(NEW);
        audit_row.old_data := row_to_json(OLD);
    ELSIF TG_OP = 'DELETE' THEN
        audit_row.action := 'DELETE';
        audit_row.new_data := NULL;
        audit_row.old_data := row_to_json(OLD);
    END IF;

    IF TG_TABLE_NAME IN ('products', 'customers', 'offers', 'pre_invoices', 'invoices',
                         'cash_registers', 'consignments', 'inventory_entries', 'stores',
                         'categories', 'product_categories') THEN
        IF TG_OP = 'DELETE' THEN
            audit_row.organization_id := OLD.organization_id;
        ELSE
            audit_row.organization_id := NEW.organization_id;
        END IF;
    END IF;

    audit_row.table_name := TG_TABLE_NAME;
    audit_row.record_id := CASE
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
    END;
    audit_row.user_id := NULLIF(current_user_id, '')::UUID;
    audit_row.ip_address := NULLIF(client_ip, '')::INET;
    audit_row.user_agent := client_ua;

    INSERT INTO audit_logs (
        organization_id, user_id, table_name, record_id, action,
        old_data, new_data, ip_address, user_agent
    ) VALUES (
        audit_row.organization_id, audit_row.user_id, audit_row.table_name,
        audit_row.record_id, audit_row.action, audit_row.old_data,
        audit_row.new_data, audit_row.ip_address, audit_row.user_agent
    );

    RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.clean_old_audit_logs()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE deleted_count INTEGER; cutoff_date TIMESTAMPTZ;
BEGIN
    cutoff_date := NOW() - INTERVAL '2 years';
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    DELETE FROM public.audit_logs WHERE created_at < cutoff_date;
    deleted_count := ROW_COUNT;
    RAISE NOTICE 'Audit log cleanup: deleted % records older than %', deleted_count, cutoff_date;
    RETURN deleted_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.clean_old_audit_logs_manual()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE deleted_count INTEGER; cutoff_date TIMESTAMPTZ; start_time TIMESTAMPTZ := NOW();
BEGIN
    cutoff_date := NOW() - INTERVAL '2 years';
    DELETE FROM public.audit_logs WHERE created_at < cutoff_date;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'deleted_count', deleted_count, 'cutoff_date', cutoff_date, 'duration_ms', EXTRACT(MILLISECONDS FROM NOW() - start_time)::INTEGER);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_consignment_document_number(org_id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    current_year VARCHAR(4);
    max_number INTEGER;
    new_number VARCHAR(50);
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(document_number FROM 'CONS-' || current_year || '-([0-9]+)')
            AS INTEGER
        )
    ), 0) INTO max_number
    FROM public.consignment_documents
    WHERE organization_id = org_id
    AND document_number LIKE 'CONS-' || current_year || '-%';
    new_number := 'CONS-' || current_year || '-' || LPAD((max_number + 1)::TEXT, 4, '0');
    RETURN new_number;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_organization_ids()
 RETURNS uuid[]
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    RETURN ARRAY(
        SELECT organization_id
        FROM public.organization_members
        WHERE user_id = (SELECT auth.uid())
          AND is_active = true
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_org_id UUID;
    v_org_name TEXT;
    v_org_slug TEXT;
    v_owner_role_id UUID;
BEGIN
    v_org_name := COALESCE(
        NEW.raw_user_meta_data->>'organization_name',
        CONCAT(COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), '''s Organization')
    );
    v_org_slug := lower(regexp_replace(v_org_name, '[^a-z0-9]+', '-', 'gi'));
    v_org_slug := trim(both '-' from v_org_slug);
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_org_slug) LOOP
        v_org_slug := v_org_slug || '-' || floor(random() * 1000)::text;
    END LOOP;
    INSERT INTO public.organizations (name, slug, is_active, subscription_plan)
    VALUES (v_org_name, v_org_slug, true, 'free')
    RETURNING id INTO v_org_id;
    INSERT INTO public.profiles (id, organization_id, full_name, email, language, timezone)
    VALUES (
        NEW.id,
        v_org_id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'es',
        'America/Caracas'
    );
    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (v_org_id, NEW.id, 'owner');
    SELECT id INTO v_owner_role_id
    FROM public.roles
    WHERE name = 'org_owner' AND organization_id = v_org_id
    LIMIT 1;
    IF v_owner_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id, organization_id)
        VALUES (NEW.id, v_owner_role_id, v_org_id);
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_permission(p_permission character varying, p_scope character varying DEFAULT 'organization'::character varying, p_store_id uuid DEFAULT NULL::uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    v_has_permission BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = auth.uid()
        AND p.module || '.' || p.action = p_permission
        AND (
            p_scope = 'organization' OR
            (p_scope = 'store' AND ur.store_id = p_store_id) OR
            p_scope = 'own'
        )
    ) INTO v_has_permission;
    RETURN v_has_permission;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.initialize_organization_roles(org_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
    owner_role_id UUID;
    admin_role_id UUID;
    manager_role_id UUID;
    cashier_role_id UUID;
    viewer_role_id UUID;
BEGIN
    INSERT INTO public.roles (organization_id, name, description, is_system_role)
    VALUES (org_id, 'org_owner', 'Organization Owner - Full access', true)
    RETURNING id INTO owner_role_id;

    INSERT INTO public.roles (organization_id, name, description, is_system_role)
    VALUES (org_id, 'org_admin', 'Organization Administrator', true)
    RETURNING id INTO admin_role_id;

    INSERT INTO public.roles (organization_id, name, description, is_system_role)
    VALUES (org_id, 'store_manager', 'Store Manager', true)
    RETURNING id INTO manager_role_id;

    INSERT INTO public.roles (organization_id, name, description, is_system_role)
    VALUES (org_id, 'cashier', 'Cashier', true)
    RETURNING id INTO cashier_role_id;

    INSERT INTO public.roles (organization_id, name, description, is_system_role)
    VALUES (org_id, 'viewer', 'View Only Access', true)
    RETURNING id INTO viewer_role_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.on_organization_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    PERFORM public.initialize_organization_roles(NEW.id);
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_store_currency_code()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
BEGIN
    IF NEW.currency_code IS NOT NULL THEN
        SELECT id INTO NEW.currency_id FROM public.currencies WHERE lower(code) = lower(NEW.currency_code) LIMIT 1;
    END IF;
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."cash_register_sessions" to "anon";

grant insert on table "public"."cash_register_sessions" to "anon";

grant references on table "public"."cash_register_sessions" to "anon";

grant select on table "public"."cash_register_sessions" to "anon";

grant trigger on table "public"."cash_register_sessions" to "anon";

grant truncate on table "public"."cash_register_sessions" to "anon";

grant update on table "public"."cash_register_sessions" to "anon";

grant delete on table "public"."cash_register_sessions" to "authenticated";

grant insert on table "public"."cash_register_sessions" to "authenticated";

grant references on table "public"."cash_register_sessions" to "authenticated";

grant select on table "public"."cash_register_sessions" to "authenticated";

grant trigger on table "public"."cash_register_sessions" to "authenticated";

grant truncate on table "public"."cash_register_sessions" to "authenticated";

grant update on table "public"."cash_register_sessions" to "authenticated";

grant delete on table "public"."cash_register_sessions" to "service_role";

grant insert on table "public"."cash_register_sessions" to "service_role";

grant references on table "public"."cash_register_sessions" to "service_role";

grant select on table "public"."cash_register_sessions" to "service_role";

grant trigger on table "public"."cash_register_sessions" to "service_role";

grant truncate on table "public"."cash_register_sessions" to "service_role";

grant update on table "public"."cash_register_sessions" to "service_role";


  create policy "org_members_insert_cash_movements"
  on "public"."cash_movements"
  as permissive
  for insert
  to public
with check ((register_id IN ( SELECT cash_registers.id
   FROM public.cash_registers
  WHERE (cash_registers.organization_id IN ( SELECT organization_members.organization_id
           FROM public.organization_members
          WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND (organization_members.is_active = true)))))));



  create policy "org_members_select_cash_movements"
  on "public"."cash_movements"
  as permissive
  for select
  to public
using ((register_id IN ( SELECT cash_registers.id
   FROM public.cash_registers
  WHERE (cash_registers.organization_id IN ( SELECT organization_members.organization_id
           FROM public.organization_members
          WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND (organization_members.is_active = true)))))));



  create policy "Session owners can update"
  on "public"."cash_register_sessions"
  as permissive
  for update
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Users can create sessions"
  on "public"."cash_register_sessions"
  as permissive
  for insert
  to public
with check ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND (organization_members.is_active = true)))));



  create policy "Users can view sessions in their organization"
  on "public"."cash_register_sessions"
  as permissive
  for select
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND (organization_members.is_active = true)))));



  create policy "org_members_insert_cash_registers"
  on "public"."cash_registers"
  as permissive
  for insert
  to public
with check ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND (organization_members.is_active = true)))));



  create policy "org_members_select_cash_registers"
  on "public"."cash_registers"
  as permissive
  for select
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND (organization_members.is_active = true)))));



  create policy "org_members_update_cash_registers"
  on "public"."cash_registers"
  as permissive
  for update
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND (organization_members.is_active = true)))));



  create policy "eltoque_tokens_delete_admins"
  on "public"."organization_eltoque_tokens"
  as permissive
  for delete
  to authenticated
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])) AND (organization_members.is_active = true)))));



  create policy "eltoque_tokens_insert_admins"
  on "public"."organization_eltoque_tokens"
  as permissive
  for insert
  to authenticated
with check ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])) AND (organization_members.is_active = true)))));



  create policy "eltoque_tokens_select_own_org"
  on "public"."organization_eltoque_tokens"
  as permissive
  for select
  to authenticated
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND (organization_members.is_active = true)))));



  create policy "eltoque_tokens_update_admins"
  on "public"."organization_eltoque_tokens"
  as permissive
  for update
  to authenticated
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])) AND (organization_members.is_active = true)))));



  create policy "Members can view organization settings"
  on "public"."organization_settings"
  as permissive
  for select
  to authenticated
using ((organization_id = ANY (public.get_user_organization_ids())));



  create policy "permissions_select_authenticated"
  on "public"."permissions"
  as permissive
  for select
  to authenticated
using (true);



  create policy "role_permissions_delete_admins"
  on "public"."role_permissions"
  as permissive
  for delete
  to authenticated
using ((role_id IN ( SELECT r.id
   FROM public.roles r
  WHERE (r.organization_id IN ( SELECT om.organization_id
           FROM public.organization_members om
          WHERE ((om.user_id = ( SELECT auth.uid() AS uid)) AND ((om.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])) AND (om.is_active = true)))))));



  create policy "role_permissions_insert_admins"
  on "public"."role_permissions"
  as permissive
  for insert
  to authenticated
with check ((role_id IN ( SELECT r.id
   FROM public.roles r
  WHERE (r.organization_id IN ( SELECT om.organization_id
           FROM public.organization_members om
          WHERE ((om.user_id = ( SELECT auth.uid() AS uid)) AND ((om.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])) AND (om.is_active = true)))))));



  create policy "role_permissions_select_org_members"
  on "public"."role_permissions"
  as permissive
  for select
  to authenticated
using ((role_id IN ( SELECT r.id
   FROM public.roles r
  WHERE ((r.organization_id IN ( SELECT profiles.organization_id
           FROM public.profiles
          WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) OR (r.organization_id IS NULL)))));



  create policy "roles_delete_admins"
  on "public"."roles"
  as permissive
  for delete
  to authenticated
using (((is_system_role = false) AND (organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE ((om.user_id = ( SELECT auth.uid() AS uid)) AND ((om.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])) AND (om.is_active = true))))));



  create policy "roles_insert_admins"
  on "public"."roles"
  as permissive
  for insert
  to authenticated
with check ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE ((om.user_id = ( SELECT auth.uid() AS uid)) AND ((om.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])) AND (om.is_active = true)))));



  create policy "roles_select_org_members"
  on "public"."roles"
  as permissive
  for select
  to authenticated
using (((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))) OR (organization_id IS NULL)));



  create policy "roles_update_admins"
  on "public"."roles"
  as permissive
  for update
  to authenticated
using ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE ((om.user_id = ( SELECT auth.uid() AS uid)) AND ((om.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])) AND (om.is_active = true)))))
with check ((organization_id IN ( SELECT om.organization_id
   FROM public.organization_members om
  WHERE ((om.user_id = ( SELECT auth.uid() AS uid)) AND ((om.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])) AND (om.is_active = true)))));



  create policy "Admins can delete stores"
  on "public"."stores"
  as permissive
  for delete
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Admins can insert stores"
  on "public"."stores"
  as permissive
  for insert
  to public
with check ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Admins can update stores"
  on "public"."stores"
  as permissive
  for update
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Users can create consignment documents in their org"
  on "public"."consignment_documents"
  as permissive
  for insert
  to public
with check ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can update their org's consignment documents"
  on "public"."consignment_documents"
  as permissive
  for update
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can view their org's consignment documents"
  on "public"."consignment_documents"
  as permissive
  for select
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can create consignment payments in their org"
  on "public"."consignment_payments"
  as permissive
  for insert
  to public
with check ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can view their org's consignment payments"
  on "public"."consignment_payments"
  as permissive
  for select
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can manage consignment"
  on "public"."consignment_stock"
  as permissive
  for all
  to public
using ((organization_id = ANY (public.get_user_organization_ids())));



  create policy "Users can manage customers"
  on "public"."customers"
  as permissive
  for all
  to public
using ((organization_id = ANY (public.get_user_organization_ids())));



  create policy "Admins can create exchange rates"
  on "public"."exchange_rates"
  as permissive
  for insert
  to public
with check ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Admins can delete exchange rates"
  on "public"."exchange_rates"
  as permissive
  for delete
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Admins can update exchange rates"
  on "public"."exchange_rates"
  as permissive
  for update
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Users can view exchange rates"
  on "public"."exchange_rates"
  as permissive
  for select
  to public
using ((organization_id = ANY (public.get_user_organization_ids())));



  create policy "multi_tenant_inventory"
  on "public"."inventory"
  as permissive
  for all
  to public
using ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));



  create policy "multi_tenant_inventory_entries"
  on "public"."inventory_entries"
  as permissive
  for all
  to public
using ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));



  create policy "multi_tenant_inventory_entry_items"
  on "public"."inventory_entry_items"
  as permissive
  for all
  to public
using ((entry_id IN ( SELECT inventory_entries.id
   FROM public.inventory_entries
  WHERE (inventory_entries.organization_id IN ( SELECT profiles.organization_id
           FROM public.profiles
          WHERE (profiles.id = ( SELECT auth.uid() AS uid)))))));



  create policy "multi_tenant_inventory_movements"
  on "public"."inventory_movements"
  as permissive
  for all
  to public
using ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE (profiles.id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can manage invoices"
  on "public"."invoices"
  as permissive
  for all
  to public
using ((organization_id = ANY (public.get_user_organization_ids())));



  create policy "invoices_team_update"
  on "public"."invoices"
  as permissive
  for update
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = auth.uid()))));



  create policy "Admins can create invitations"
  on "public"."organization_invitations"
  as permissive
  for insert
  to public
with check ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Admins can delete invitations"
  on "public"."organization_invitations"
  as permissive
  for delete
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Admins can update invitations"
  on "public"."organization_invitations"
  as permissive
  for update
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Admins can view organization invitations"
  on "public"."organization_invitations"
  as permissive
  for select
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Enable delete for organization owners"
  on "public"."organization_members"
  as permissive
  for delete
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR ((role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))));



  create policy "Enable insert for authenticated users"
  on "public"."organization_members"
  as permissive
  for insert
  to authenticated
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "Enable update for organization owners"
  on "public"."organization_members"
  as permissive
  for update
  to authenticated
using (((user_id = ( SELECT auth.uid() AS uid)) OR ((role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))));



  create policy "Owners can insert organization settings"
  on "public"."organization_settings"
  as permissive
  for insert
  to authenticated
with check ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = organization_settings.organization_id) AND (organization_members.user_id = auth.uid()) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])) AND (organization_members.is_active = true)))));



  create policy "Owners can update organization settings"
  on "public"."organization_settings"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.organization_members
  WHERE ((organization_members.organization_id = organization_settings.organization_id) AND (organization_members.user_id = auth.uid()) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])) AND (organization_members.is_active = true)))));



  create policy "Authenticated users can create organizations"
  on "public"."organizations"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) IS NOT NULL));



  create policy "Users can update their organizations"
  on "public"."organizations"
  as permissive
  for update
  to public
using ((id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Users can view their organizations"
  on "public"."organizations"
  as permissive
  for select
  to public
using ((id = ANY (public.get_user_organization_ids())));



  create policy "Admins can delete categories"
  on "public"."product_categories"
  as permissive
  for delete
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));



  create policy "Users can create categories in their organization"
  on "public"."product_categories"
  as permissive
  for insert
  to public
with check ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.organization_id IS NOT NULL))
UNION
 SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'inventory_manager'::character varying])::text[]))))));



  create policy "Users can update categories in their organization"
  on "public"."product_categories"
  as permissive
  for update
  to public
using ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.organization_id IS NOT NULL))
UNION
 SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE ((organization_members.user_id = ( SELECT auth.uid() AS uid)) AND ((organization_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'inventory_manager'::character varying])::text[]))))));



  create policy "Users can view categories from their organizations"
  on "public"."product_categories"
  as permissive
  for select
  to public
using ((organization_id IN ( SELECT profiles.organization_id
   FROM public.profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.organization_id IS NOT NULL))
UNION
 SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = ( SELECT auth.uid() AS uid)))));



  create policy "Users can create products"
  on "public"."products"
  as permissive
  for insert
  to public
with check ((organization_id = ANY (public.get_user_organization_ids())));



  create policy "Users can update products"
  on "public"."products"
  as permissive
  for update
  to public
using ((organization_id = ANY (public.get_user_organization_ids())));



  create policy "Users can view products"
  on "public"."products"
  as permissive
  for select
  to public
using ((organization_id = ANY (public.get_user_organization_ids())));



  create policy "Users can insert their own profile"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((( SELECT auth.uid() AS uid) = id));



  create policy "Users can update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((id = ( SELECT auth.uid() AS uid)));



  create policy "Users can view profiles in their organizations"
  on "public"."profiles"
  as permissive
  for select
  to public
using ((organization_id = ANY (public.get_user_organization_ids())));



  create policy "Users can view stores in their organizations"
  on "public"."stores"
  as permissive
  for select
  to public
using ((organization_id = ANY (public.get_user_organization_ids())));



  create policy "Users can manage suppliers"
  on "public"."suppliers"
  as permissive
  for all
  to public
using ((organization_id = ANY (public.get_user_organization_ids())));



  create policy "team_schedules_org_delete"
  on "public"."team_schedules"
  as permissive
  for delete
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = auth.uid()))));



  create policy "team_schedules_org_insert"
  on "public"."team_schedules"
  as permissive
  for insert
  to public
with check ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = auth.uid()))));



  create policy "team_schedules_org_update"
  on "public"."team_schedules"
  as permissive
  for update
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = auth.uid()))));



  create policy "team_schedules_org_view"
  on "public"."team_schedules"
  as permissive
  for select
  to public
using ((organization_id IN ( SELECT organization_members.organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = auth.uid()))));



  create policy "user_stores_delete_own"
  on "public"."user_stores"
  as permissive
  for delete
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "user_stores_insert_own"
  on "public"."user_stores"
  as permissive
  for insert
  to public
with check ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "user_stores_select_own"
  on "public"."user_stores"
  as permissive
  for select
  to public
using ((user_id = ( SELECT auth.uid() AS uid)));



  create policy "user_stores_update_own"
  on "public"."user_stores"
  as permissive
  for update
  to public
using ((user_id = ( SELECT auth.uid() AS uid)))
with check ((user_id = ( SELECT auth.uid() AS uid)));


CREATE TRIGGER update_consignment_documents_updated_at_trigger BEFORE UPDATE ON public.consignment_documents FOR EACH ROW EXECUTE FUNCTION public.update_consignment_documents_updated_at();

CREATE TRIGGER update_consignment_stock_updated_at BEFORE UPDATE ON public.consignment_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_settings_updated_at BEFORE UPDATE ON public.organization_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_organization_created AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.on_organization_created();

CREATE TRIGGER trigger_organization_settings_created AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.create_organization_settings();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_sync_store_currency_code BEFORE INSERT OR UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.sync_store_currency_code();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_schedules_updated_at BEFORE UPDATE ON public.work_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

drop trigger if exists "on_auth_user_created" on "auth"."users";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

drop policy "Authenticated users can delete products" on "storage"."objects";

drop policy "Authenticated users can update products" on "storage"."objects";

drop policy "Authenticated users can upload products" on "storage"."objects";


  create policy "Authenticated users can delete products"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'products'::text) AND ((storage.foldername(name))[1] IN ( SELECT (organization_members.organization_id)::text AS organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = auth.uid())))));



  create policy "Authenticated users can update products"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'products'::text) AND ((storage.foldername(name))[1] IN ( SELECT (organization_members.organization_id)::text AS organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = auth.uid())))));



  create policy "Authenticated users can upload products"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'products'::text) AND ((storage.foldername(name))[1] IN ( SELECT (organization_members.organization_id)::text AS organization_id
   FROM public.organization_members
  WHERE (organization_members.user_id = auth.uid())))));



