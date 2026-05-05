drop policy "Users can create transfers in their org" on "public"."inventory_transfers";

drop policy "Users can update transfers in their org" on "public"."inventory_transfers";

drop policy "Users can view transfers in their org" on "public"."inventory_transfers";

drop policy "Users can delete thresholds in their organization" on "public"."product_thresholds";

drop policy "Users can insert thresholds in their organization" on "public"."product_thresholds";

drop policy "Users can update thresholds in their organization" on "public"."product_thresholds";

drop policy "Users can view thresholds in their organization" on "public"."product_thresholds";

drop policy "Users can delete tasks in their organization" on "public"."team_tasks";

drop policy "Users can insert tasks in their organization" on "public"."team_tasks";

drop policy "Users can update tasks in their organization" on "public"."team_tasks";

drop policy "Users can view tasks in their organization" on "public"."team_tasks";

revoke delete on table "public"."inventory_transfers" from "anon";

revoke insert on table "public"."inventory_transfers" from "anon";

revoke references on table "public"."inventory_transfers" from "anon";

revoke select on table "public"."inventory_transfers" from "anon";

revoke trigger on table "public"."inventory_transfers" from "anon";

revoke truncate on table "public"."inventory_transfers" from "anon";

revoke update on table "public"."inventory_transfers" from "anon";

revoke delete on table "public"."inventory_transfers" from "authenticated";

revoke insert on table "public"."inventory_transfers" from "authenticated";

revoke references on table "public"."inventory_transfers" from "authenticated";

revoke select on table "public"."inventory_transfers" from "authenticated";

revoke trigger on table "public"."inventory_transfers" from "authenticated";

revoke truncate on table "public"."inventory_transfers" from "authenticated";

revoke update on table "public"."inventory_transfers" from "authenticated";

revoke delete on table "public"."inventory_transfers" from "service_role";

revoke insert on table "public"."inventory_transfers" from "service_role";

revoke references on table "public"."inventory_transfers" from "service_role";

revoke select on table "public"."inventory_transfers" from "service_role";

revoke trigger on table "public"."inventory_transfers" from "service_role";

revoke truncate on table "public"."inventory_transfers" from "service_role";

revoke update on table "public"."inventory_transfers" from "service_role";

revoke delete on table "public"."product_thresholds" from "anon";

revoke insert on table "public"."product_thresholds" from "anon";

revoke references on table "public"."product_thresholds" from "anon";

revoke select on table "public"."product_thresholds" from "anon";

revoke trigger on table "public"."product_thresholds" from "anon";

revoke truncate on table "public"."product_thresholds" from "anon";

revoke update on table "public"."product_thresholds" from "anon";

revoke delete on table "public"."product_thresholds" from "authenticated";

revoke insert on table "public"."product_thresholds" from "authenticated";

revoke references on table "public"."product_thresholds" from "authenticated";

revoke select on table "public"."product_thresholds" from "authenticated";

revoke trigger on table "public"."product_thresholds" from "authenticated";

revoke truncate on table "public"."product_thresholds" from "authenticated";

revoke update on table "public"."product_thresholds" from "authenticated";

revoke delete on table "public"."product_thresholds" from "service_role";

revoke insert on table "public"."product_thresholds" from "service_role";

revoke references on table "public"."product_thresholds" from "service_role";

revoke select on table "public"."product_thresholds" from "service_role";

revoke trigger on table "public"."product_thresholds" from "service_role";

revoke truncate on table "public"."product_thresholds" from "service_role";

revoke update on table "public"."product_thresholds" from "service_role";

revoke delete on table "public"."team_tasks" from "anon";

revoke insert on table "public"."team_tasks" from "anon";

revoke references on table "public"."team_tasks" from "anon";

revoke select on table "public"."team_tasks" from "anon";

revoke trigger on table "public"."team_tasks" from "anon";

revoke truncate on table "public"."team_tasks" from "anon";

revoke update on table "public"."team_tasks" from "anon";

revoke delete on table "public"."team_tasks" from "authenticated";

revoke insert on table "public"."team_tasks" from "authenticated";

revoke references on table "public"."team_tasks" from "authenticated";

revoke select on table "public"."team_tasks" from "authenticated";

revoke trigger on table "public"."team_tasks" from "authenticated";

revoke truncate on table "public"."team_tasks" from "authenticated";

revoke update on table "public"."team_tasks" from "authenticated";

revoke delete on table "public"."team_tasks" from "service_role";

revoke insert on table "public"."team_tasks" from "service_role";

revoke references on table "public"."team_tasks" from "service_role";

revoke select on table "public"."team_tasks" from "service_role";

revoke trigger on table "public"."team_tasks" from "service_role";

revoke truncate on table "public"."team_tasks" from "service_role";

revoke update on table "public"."team_tasks" from "service_role";

alter table "public"."inventory_transfers" drop constraint "inventory_transfers_from_store_id_fkey";

alter table "public"."inventory_transfers" drop constraint "inventory_transfers_organization_id_fkey";

alter table "public"."inventory_transfers" drop constraint "inventory_transfers_product_id_fkey";

alter table "public"."inventory_transfers" drop constraint "inventory_transfers_status_check";

alter table "public"."inventory_transfers" drop constraint "inventory_transfers_to_store_id_fkey";

alter table "public"."inventory_transfers" drop constraint "inventory_transfers_variant_id_fkey";

alter table "public"."product_thresholds" drop constraint "product_thresholds_organization_id_fkey";

alter table "public"."product_thresholds" drop constraint "product_thresholds_product_id_fkey";

alter table "public"."product_thresholds" drop constraint "product_thresholds_product_id_store_id_key";

alter table "public"."product_thresholds" drop constraint "product_thresholds_store_id_fkey";

alter table "public"."team_tasks" drop constraint "team_tasks_assigned_to_fkey";

alter table "public"."team_tasks" drop constraint "team_tasks_created_by_fkey";

alter table "public"."team_tasks" drop constraint "team_tasks_organization_id_fkey";

alter table "public"."team_tasks" drop constraint "team_tasks_priority_check";

alter table "public"."team_tasks" drop constraint "team_tasks_status_check";

alter table "public"."team_tasks" drop constraint "team_tasks_team_id_fkey";

alter table "public"."inventory_transfers" drop constraint "inventory_transfers_pkey";

alter table "public"."product_thresholds" drop constraint "product_thresholds_pkey";

alter table "public"."team_tasks" drop constraint "team_tasks_pkey";

drop index if exists "public"."idx_inventory_transfers_created_at";

drop index if exists "public"."idx_inventory_transfers_from_store";

drop index if exists "public"."idx_inventory_transfers_org";

drop index if exists "public"."idx_inventory_transfers_status";

drop index if exists "public"."idx_inventory_transfers_to_store";

drop index if exists "public"."idx_product_thresholds_org";

drop index if exists "public"."idx_product_thresholds_product";

drop index if exists "public"."idx_product_thresholds_store";

drop index if exists "public"."idx_team_tasks_assigned";

drop index if exists "public"."idx_team_tasks_due_date";

drop index if exists "public"."idx_team_tasks_org";

drop index if exists "public"."idx_team_tasks_status";

drop index if exists "public"."idx_team_tasks_team";

drop index if exists "public"."inventory_transfers_pkey";

drop index if exists "public"."product_thresholds_pkey";

drop index if exists "public"."product_thresholds_product_id_store_id_key";

drop index if exists "public"."team_tasks_pkey";

drop table "public"."inventory_transfers";

drop table "public"."product_thresholds";

drop table "public"."team_tasks";

alter table "public"."currencies" alter column "code" set data type character varying(20) using "code"::character varying(20);

alter table "public"."currencies" alter column "name" set data type character varying(100) using "name"::character varying(100);

set check_function_bodies = off;

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


