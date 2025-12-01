-- Create stocks_browser table for caching stock data
CREATE TABLE public.stocks_browser (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  exchange TEXT,
  currency TEXT,
  country TEXT,
  type TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stocks_browser ENABLE ROW LEVEL SECURITY;

-- Everyone can view stocks
CREATE POLICY "Anyone can view stocks"
ON public.stocks_browser
FOR SELECT
USING (true);

-- Only admins can insert/update stocks
CREATE POLICY "Admins can manage stocks"
ON public.stocks_browser
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create paper_trades table for virtual trading
CREATE TABLE public.paper_trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  quantity NUMERIC NOT NULL CHECK (quantity > 0),
  price NUMERIC NOT NULL CHECK (price > 0),
  total_amount NUMERIC NOT NULL,
  trade_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;

-- Users can view their own trades
CREATE POLICY "Users can view own trades"
ON public.paper_trades
FOR SELECT
USING (auth.uid() = user_id);

-- Premium and admin users can insert trades
CREATE POLICY "Premium users can create trades"
ON public.paper_trades
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  (has_role(auth.uid(), 'premium'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
);

-- Admins can view all trades
CREATE POLICY "Admins can view all trades"
ON public.paper_trades
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for performance
CREATE INDEX idx_stocks_browser_symbol ON public.stocks_browser(symbol);
CREATE INDEX idx_stocks_browser_name ON public.stocks_browser(name);
CREATE INDEX idx_paper_trades_user_id ON public.paper_trades(user_id);
CREATE INDEX idx_paper_trades_symbol ON public.paper_trades(symbol);
CREATE INDEX idx_paper_trades_date ON public.paper_trades(trade_date DESC);