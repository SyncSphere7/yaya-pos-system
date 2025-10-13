-- Enhance payments table for full Pesapal integration
-- Add missing columns for mobile money and tracking

-- Add new columns if they don't exist
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id);

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS processed_by uuid REFERENCES public.users(id);

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS phone_number varchar(20);

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_date timestamp with time zone;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS confirmation_code varchar(100);

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS payment_description text;

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'UGX';

-- Update method constraint to match our payment methods
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE public.payments 
ADD CONSTRAINT payments_method_check 
CHECK (method IN ('cash', 'airtel_money', 'mtn_momo', 'card_pos'));

-- Add payment_status to orders if not exists
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status varchar(20) 
CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'partially_paid', 'refunded')) 
DEFAULT 'unpaid';

-- Create additional indexes
CREATE INDEX IF NOT EXISTS idx_payments_location ON public.payments(location_id);
CREATE INDEX IF NOT EXISTS idx_payments_method ON public.payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- Update comments
COMMENT ON COLUMN public.payments.phone_number IS 'Customer phone number for mobile money payments (Airtel Money/MTN MoMo)';
COMMENT ON COLUMN public.payments.method IS 'Payment method: cash, airtel_money, mtn_momo, card_pos';
COMMENT ON COLUMN public.payments.payment_date IS 'Timestamp when payment was confirmed';
COMMENT ON COLUMN public.orders.payment_status IS 'Payment status of the order: unpaid, pending, paid, partially_paid, refunded';
