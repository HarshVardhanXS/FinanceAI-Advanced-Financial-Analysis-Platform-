-- Update the profiles SELECT policy to ensure users can ONLY view their own profile
-- The current policy already uses auth.uid() = id, which should work correctly
-- But we'll drop and recreate it with explicit naming to ensure it's clear

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can only view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);