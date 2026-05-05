-- Add 'member_joined' to notifications type CHECK constraint
DO $$
BEGIN
  ALTER TABLE public.notifications
    DROP CONSTRAINT IF EXISTS notifications_type_check;
  
  ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_type_check
    CHECK (type IN (
      'task_assigned', 'status_change', 'low_stock', 'transfer', 'movement',
      'credit_note', 'new_invoice', 'payment', 'consignment', 'new_order',
      'info', 'exchange_rate_change', 'member_joined'
    ));
END $$;
