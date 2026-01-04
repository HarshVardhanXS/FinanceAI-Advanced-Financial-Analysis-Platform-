-- Fix 1: Drop the current rate_limits policy that allows all operations
DROP POLICY IF EXISTS "Only service role can manage rate limits" ON public.rate_limits;

-- The rate_limits table should only be accessible via service_role (used by edge functions)
-- By having RLS enabled with NO policies, only service_role can access it
-- This is the correct approach since edge functions use service_role key

-- Fix 2: Add explicit admin-only SELECT policy for profiles table
-- to make it clear that only owners can view their own profiles
-- First, drop existing policies and recreate with explicit deny semantics
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Recreate as PERMISSIVE policies (default) which require the condition to be true
-- With no other policies, this ensures ONLY the profile owner can access their data
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);