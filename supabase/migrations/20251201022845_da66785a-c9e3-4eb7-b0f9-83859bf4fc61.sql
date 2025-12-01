-- Create options_contracts table for storing available options
CREATE TABLE public.options_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  underlying_symbol TEXT NOT NULL,
  contract_symbol TEXT NOT NULL UNIQUE,
  option_type TEXT NOT NULL CHECK (option_type IN ('call', 'put')),
  strike_price NUMERIC NOT NULL CHECK (strike_price > 0),
  expiration_date DATE NOT NULL,
  premium NUMERIC NOT NULL CHECK (premium > 0),
  implied_volatility NUMERIC,
  delta NUMERIC,
  gamma NUMERIC,
  theta NUMERIC,
  vega NUMERIC,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.options_contracts ENABLE ROW LEVEL SECURITY;

-- Everyone can view options contracts
CREATE POLICY "Anyone can view options contracts"
ON public.options_contracts
FOR SELECT
USING (true);

-- Only admins can manage options contracts
CREATE POLICY "Admins can manage options contracts"
ON public.options_contracts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create options_trades table for user trades
CREATE TABLE public.options_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  contract_symbol TEXT NOT NULL,
  underlying_symbol TEXT NOT NULL,
  option_type TEXT NOT NULL CHECK (option_type IN ('call', 'put')),
  trade_action TEXT NOT NULL CHECK (trade_action IN ('buy', 'sell')),
  contracts INTEGER NOT NULL CHECK (contracts > 0),
  strike_price NUMERIC NOT NULL CHECK (strike_price > 0),
  premium NUMERIC NOT NULL CHECK (premium > 0),
  expiration_date DATE NOT NULL,
  total_cost NUMERIC NOT NULL,
  trade_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.options_trades ENABLE ROW LEVEL SECURITY;

-- Users can view their own options trades
CREATE POLICY "Users can view own options trades"
ON public.options_trades
FOR SELECT
USING (auth.uid() = user_id);

-- Only admins can create options trades
CREATE POLICY "Admins can create options trades"
ON public.options_trades
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Admins can update their own trades
CREATE POLICY "Admins can update own options trades"
ON public.options_trades
FOR UPDATE
USING (auth.uid() = user_id AND has_role(auth.uid(), 'admin'::app_role));

-- Admins can view all trades
CREATE POLICY "Admins can view all options trades"
ON public.options_trades
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_options_contracts_symbol ON public.options_contracts(underlying_symbol);
CREATE INDEX idx_options_contracts_expiration ON public.options_contracts(expiration_date);
CREATE INDEX idx_options_contracts_type ON public.options_contracts(option_type);
CREATE INDEX idx_options_trades_user_id ON public.options_trades(user_id);
CREATE INDEX idx_options_trades_symbol ON public.options_trades(underlying_symbol);
CREATE INDEX idx_options_trades_status ON public.options_trades(status);