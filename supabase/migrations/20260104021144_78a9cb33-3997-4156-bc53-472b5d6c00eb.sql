-- Add CHECK constraints to options_trades table for server-side validation
ALTER TABLE public.options_trades
ADD CONSTRAINT options_trades_contracts_range CHECK (contracts >= 1 AND contracts <= 1000),
ADD CONSTRAINT options_trades_strike_price_positive CHECK (strike_price > 0),
ADD CONSTRAINT options_trades_premium_positive CHECK (premium > 0),
ADD CONSTRAINT options_trades_total_cost_positive CHECK (total_cost > 0),
ADD CONSTRAINT options_trades_option_type_valid CHECK (option_type IN ('call', 'put')),
ADD CONSTRAINT options_trades_trade_action_valid CHECK (trade_action IN ('buy', 'sell')),
ADD CONSTRAINT options_trades_status_valid CHECK (status IN ('open', 'closed', 'expired'));

-- Create a validation trigger function for options trades
CREATE OR REPLACE FUNCTION public.validate_options_trade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_virtual_cash NUMERIC;
BEGIN
  -- Validate contracts range (redundant with CHECK but provides better error message)
  IF NEW.contracts < 1 OR NEW.contracts > 1000 THEN
    RAISE EXCEPTION 'Number of contracts must be between 1 and 1000';
  END IF;

  -- Validate strike price
  IF NEW.strike_price <= 0 THEN
    RAISE EXCEPTION 'Strike price must be positive';
  END IF;

  -- Validate premium
  IF NEW.premium <= 0 THEN
    RAISE EXCEPTION 'Premium must be positive';
  END IF;

  -- Validate total cost calculation (contracts * premium * 100)
  IF ABS(NEW.total_cost - (NEW.contracts * NEW.premium * 100)) > 0.01 THEN
    RAISE EXCEPTION 'Total cost calculation is incorrect';
  END IF;

  -- Validate expiration date is in the future for new trades
  IF NEW.expiration_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Expiration date must be in the future';
  END IF;

  -- Validate user has sufficient virtual cash for buy orders
  IF NEW.trade_action = 'buy' THEN
    SELECT virtual_cash INTO user_virtual_cash
    FROM public.user_settings
    WHERE user_id = NEW.user_id;
    
    IF user_virtual_cash IS NULL THEN
      RAISE EXCEPTION 'User settings not found';
    END IF;
    
    IF user_virtual_cash < NEW.total_cost THEN
      RAISE EXCEPTION 'Insufficient virtual cash. Required: %, Available: %', NEW.total_cost, user_virtual_cash;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for options trade validation
DROP TRIGGER IF EXISTS validate_options_trade_trigger ON public.options_trades;
CREATE TRIGGER validate_options_trade_trigger
  BEFORE INSERT ON public.options_trades
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_options_trade();