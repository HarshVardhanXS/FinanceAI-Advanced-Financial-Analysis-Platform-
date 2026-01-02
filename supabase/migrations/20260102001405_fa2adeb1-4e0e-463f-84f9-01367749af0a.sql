-- Drop the existing permissive policy that exposes IP addresses
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Create a restrictive policy that only allows service role access
-- Note: Edge functions use service role automatically, so this won't break rate limiting
CREATE POLICY "Only service role can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);