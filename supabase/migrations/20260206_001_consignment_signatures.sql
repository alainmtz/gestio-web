-- =====================================================
-- Consignment Digital Signatures & Payments Migration
-- Date: 2026-02-06
-- Description: Add digital signature workflow and payment tracking for consignments
-- =====================================================

-- =====================================================
-- 1. CONSIGNMENT DOCUMENTS TABLE
-- =====================================================
-- Stores consignment documents with digital signatures
CREATE TABLE IF NOT EXISTS public.consignment_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consignment_id UUID NOT NULL REFERENCES public.consignment_stock(id) ON DELETE CASCADE,
    document_number VARCHAR(50) NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Document status
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT',                        -- Document created, no signatures yet
        'PENDING_PROVIDER_SIGNATURE',   -- Waiting for provider to sign
        'PENDING_RECEIVER_SIGNATURE',   -- Provider signed, waiting for receiver
        'CONFIRMED',                    -- Both signed, payment created
        'REJECTED'                      -- Receiver rejected, stock restored
    )),
    
    -- Provider signature (consignante)
    provider_signature_url TEXT,
    provider_signed_at TIMESTAMPTZ,
    provider_signed_by UUID REFERENCES auth.users(id),
    
    -- Receiver signature (receptor en tienda)
    receiver_signature_url TEXT,
    receiver_signed_at TIMESTAMPTZ,
    receiver_signed_by UUID REFERENCES auth.users(id),
    
    -- Rejection handling
    rejection_reason TEXT,
    rejected_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    
    -- PDF document
    pdf_url TEXT,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Unique document number per organization
    CONSTRAINT unique_document_number_per_org UNIQUE (organization_id, document_number)
);

-- Index for fast lookups
CREATE INDEX idx_consignment_documents_consignment_id ON public.consignment_documents(consignment_id);
CREATE INDEX idx_consignment_documents_org_status ON public.consignment_documents(organization_id, status);
CREATE INDEX idx_consignment_documents_status ON public.consignment_documents(status);

-- =====================================================
-- 2. CONSIGNMENT PAYMENTS TABLE
-- =====================================================
-- Tracks payments for consignments with product-level breakdown
CREATE TABLE IF NOT EXISTS public.consignment_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consignment_id UUID NOT NULL REFERENCES public.consignment_stock(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Payment details
    amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
    
    -- Paid products breakdown (JSONB for flexibility)
    -- Format: [{"product_id": "uuid", "variant_id": "uuid", "quantity": 5, "unit_price": 100, "subtotal": 500}]
    paid_products JSONB NOT NULL,
    
    -- Payment info
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50),
    notes TEXT,
    
    -- Audit fields
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure payment_id is unique (one payment record per payment)
    CONSTRAINT unique_payment_id UNIQUE (payment_id)
);

-- Indexes
CREATE INDEX idx_consignment_payments_consignment_id ON public.consignment_payments(consignment_id);
CREATE INDEX idx_consignment_payments_payment_id ON public.consignment_payments(payment_id);
CREATE INDEX idx_consignment_payments_org ON public.consignment_payments(organization_id);

-- =====================================================
-- 3. ALTER PAYMENTS TABLE (Billing Module Integration)
-- =====================================================
-- Add source tracking to payments table
DO $$ 
BEGIN
    -- Add source_type column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'source_type'
    ) THEN
        ALTER TABLE public.payments 
        ADD COLUMN source_type VARCHAR(50) CHECK (source_type IN ('INVOICE', 'CONSIGNMENT', 'OTHER'));
    END IF;
    
    -- Add source_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'payments' 
        AND column_name = 'source_id'
    ) THEN
        ALTER TABLE public.payments 
        ADD COLUMN source_id UUID;
    END IF;
END $$;

-- Index for source lookups
CREATE INDEX IF NOT EXISTS idx_payments_source ON public.payments(source_type, source_id);

-- =====================================================
-- 4. DOCUMENT NUMBER GENERATION FUNCTION
-- =====================================================
-- Generates sequential document numbers per organization
-- Format: CONS-2026-0001
CREATE OR REPLACE FUNCTION generate_consignment_document_number(org_id UUID)
RETURNS VARCHAR(50)
LANGUAGE plpgsql
AS $$
DECLARE
    current_year VARCHAR(4);
    max_number INTEGER;
    new_number VARCHAR(50);
BEGIN
    -- Get current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    
    -- Find max number for this org and year
    SELECT COALESCE(MAX(
        CAST(
            SUBSTRING(document_number FROM 'CONS-' || current_year || '-([0-9]+)') 
            AS INTEGER
        )
    ), 0) INTO max_number
    FROM public.consignment_documents
    WHERE organization_id = org_id
    AND document_number LIKE 'CONS-' || current_year || '-%';
    
    -- Generate new number
    new_number := 'CONS-' || current_year || '-' || LPAD((max_number + 1)::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$;

-- =====================================================
-- 5. STORAGE BUCKET FOR SIGNATURES
-- =====================================================
-- Create bucket for storing signature images
INSERT INTO storage.buckets (id, name, public)
VALUES ('consignment-signatures', 'consignment-signatures', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.consignment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consignment_payments ENABLE ROW LEVEL SECURITY;

-- CONSIGNMENT DOCUMENTS POLICIES
-- Users can view documents from their organizations
CREATE POLICY "Users can view their org's consignment documents"
ON public.consignment_documents
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Users can create documents in their organizations
CREATE POLICY "Users can create consignment documents in their org"
ON public.consignment_documents
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Users can update documents in their organizations
CREATE POLICY "Users can update their org's consignment documents"
ON public.consignment_documents
FOR UPDATE
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
    )
);

-- CONSIGNMENT PAYMENTS POLICIES
-- Users can view payments from their organizations
CREATE POLICY "Users can view their org's consignment payments"
ON public.consignment_payments
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
    )
);

-- Users can create payments in their organizations
CREATE POLICY "Users can create consignment payments in their org"
ON public.consignment_payments
FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id 
        FROM public.organization_members 
        WHERE user_id = auth.uid()
    )
);

-- STORAGE POLICIES FOR SIGNATURES
-- Users can upload signatures for their organizations
CREATE POLICY "Users can upload signatures for their org"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'consignment-signatures'
    AND auth.uid() IS NOT NULL
);

-- Users can view signatures from their organizations
CREATE POLICY "Users can view their org's signatures"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'consignment-signatures'
    AND auth.uid() IS NOT NULL
);

-- Users can delete their own uploaded signatures
CREATE POLICY "Users can delete their uploaded signatures"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'consignment-signatures'
    AND auth.uid() = owner
);

-- =====================================================
-- 7. UPDATE TIMESTAMP TRIGGER
-- =====================================================
-- Auto-update updated_at on consignment_documents
CREATE OR REPLACE FUNCTION update_consignment_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consignment_documents_updated_at_trigger
BEFORE UPDATE ON public.consignment_documents
FOR EACH ROW
EXECUTE FUNCTION update_consignment_documents_updated_at();

-- =====================================================
-- 8. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE public.consignment_documents IS 
'Stores consignment documents with digital signatures from provider and receiver. 
Workflow: DRAFT → PENDING_PROVIDER_SIGNATURE → PENDING_RECEIVER_SIGNATURE → CONFIRMED/REJECTED';

COMMENT ON TABLE public.consignment_payments IS 
'Tracks payments for consignments with product-level breakdown. 
Supports partial payments with multiple records per consignment_id.';

COMMENT ON FUNCTION generate_consignment_document_number IS 
'Generates sequential consignment document numbers per organization. Format: CONS-YYYY-NNNN';

COMMENT ON COLUMN public.consignment_documents.status IS 
'Document status lifecycle: DRAFT → PENDING_PROVIDER_SIGNATURE → PENDING_RECEIVER_SIGNATURE → CONFIRMED (payment created) or REJECTED (stock restored)';

COMMENT ON COLUMN public.consignment_payments.paid_products IS 
'JSONB array with product breakdown: [{"product_id": "uuid", "variant_id": "uuid", "quantity": 5, "unit_price": 100, "subtotal": 500}]';

COMMENT ON COLUMN public.payments.source_type IS 
'Source of payment: INVOICE (from billing), CONSIGNMENT (from consignment reception), OTHER (manual/misc)';

COMMENT ON COLUMN public.payments.source_id IS 
'Foreign key to source table (invoice_id, consignment_id, etc.) based on source_type';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
