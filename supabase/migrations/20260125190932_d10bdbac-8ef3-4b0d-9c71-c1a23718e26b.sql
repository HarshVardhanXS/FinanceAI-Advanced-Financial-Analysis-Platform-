-- Add RLS policy to rate_limits table to restrict access to service role only
-- The table already has RLS enabled but no policies, making it inaccessible
-- We add a policy that allows only authenticated access for reading own records
-- But since rate_limits uses identifier (could be user_id), we need to be careful

-- Create policy for service role operations (edge functions use service role key)
-- Regular users should not be able to read this table at all
CREATE POLICY "Service role only access" 
ON public.rate_limits 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Note: Edge functions using SUPABASE_SERVICE_ROLE_KEY bypass RLS entirely
-- This policy effectively blocks all non-service-role access