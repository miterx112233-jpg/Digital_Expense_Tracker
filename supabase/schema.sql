-- ============================================================
-- Digital Expense Tracker — Supabase PostgreSQL Schema
-- Matches database_schema.md & Context.md
-- ============================================================

-- 1. Table: payment_methods
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider_name VARCHAR(100) NOT NULL, -- e.g. Visa, Mastercard, TrueMoney, PayPal
  last_four_digits VARCHAR(4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table: subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  service_name VARCHAR(150) NOT NULL,
  category VARCHAR(100) DEFAULT 'AI & Productivity',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(10) NOT NULL DEFAULT 'THB', -- 'THB' or 'USD'
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- 'monthly' or 'yearly'
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('trial', 'active', 'paused', 'cancelled')),
  next_billing_date DATE NOT NULL,
  alert_enabled BOOLEAN DEFAULT TRUE,
  cancel_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table: alert_logs (for Background Worker History)
CREATE TABLE IF NOT EXISTS public.alert_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL, -- 'LINE Notify' or 'Email'
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment methods"
  ON public.payment_methods FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.uid() = user_id);

