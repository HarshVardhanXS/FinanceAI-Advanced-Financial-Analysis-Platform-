import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Refresh token 5 minutes before expiration
const REFRESH_THRESHOLD_MS = 5 * 60 * 1000;
// Check token expiration every 30 seconds
const CHECK_INTERVAL_MS = 30 * 1000;

export const useTokenRefresh = () => {
  const { toast } = useToast();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const refreshToken = useCallback(async () => {
    if (isRefreshingRef.current) return;
    
    try {
      isRefreshingRef.current = true;
      console.log('[TokenRefresh] Refreshing session...');
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('[TokenRefresh] Failed to refresh session:', error);
        
        // If refresh fails, the user needs to re-authenticate
        if (error.message.includes('expired') || error.message.includes('invalid')) {
          toast({
            title: 'Session Expired',
            description: 'Please sign in again to continue.',
            variant: 'destructive',
          });
          
          // Sign out to clear invalid session
          await supabase.auth.signOut();
        }
        return null;
      }
      
      console.log('[TokenRefresh] Session refreshed successfully');
      return data.session;
    } catch (e) {
      console.error('[TokenRefresh] Error refreshing token:', e);
      return null;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [toast]);

  const scheduleRefresh = useCallback((expiresAt: number) => {
    // Clear any existing timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    const now = Date.now();
    const expiresAtMs = expiresAt * 1000; // Convert to milliseconds
    const timeUntilExpiry = expiresAtMs - now;
    const timeUntilRefresh = timeUntilExpiry - REFRESH_THRESHOLD_MS;

    if (timeUntilRefresh > 0) {
      console.log(`[TokenRefresh] Scheduling refresh in ${Math.round(timeUntilRefresh / 1000)}s`);
      refreshTimeoutRef.current = setTimeout(refreshToken, timeUntilRefresh);
    } else if (timeUntilExpiry > 0) {
      // Token is close to expiring, refresh now
      console.log('[TokenRefresh] Token close to expiry, refreshing now');
      refreshToken();
    }
  }, [refreshToken]);

  const checkAndRefreshToken = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;
      
      const expiresAt = session.expires_at;
      if (!expiresAt) return;

      const now = Date.now();
      const expiresAtMs = expiresAt * 1000;
      const timeUntilExpiry = expiresAtMs - now;

      // If token is expired or about to expire, refresh immediately
      if (timeUntilExpiry < REFRESH_THRESHOLD_MS) {
        console.log('[TokenRefresh] Token expired or expiring soon, refreshing...');
        await refreshToken();
      } else {
        // Schedule refresh for later
        scheduleRefresh(expiresAt);
      }
    } catch (e) {
      console.error('[TokenRefresh] Error checking token:', e);
    }
  }, [refreshToken, scheduleRefresh]);

  useEffect(() => {
    // Initial check
    checkAndRefreshToken();

    // Set up periodic checks
    checkIntervalRef.current = setInterval(checkAndRefreshToken, CHECK_INTERVAL_MS);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.expires_at) {
            scheduleRefresh(session.expires_at);
          }
        } else if (event === 'SIGNED_OUT') {
          // Clear scheduled refresh
          if (refreshTimeoutRef.current) {
            clearTimeout(refreshTimeoutRef.current);
          }
        }
      }
    );

    // Handle visibility change - refresh token when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[TokenRefresh] Tab became visible, checking token...');
        checkAndRefreshToken();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle online event - refresh token when connection is restored
    const handleOnline = () => {
      console.log('[TokenRefresh] Connection restored, checking token...');
      checkAndRefreshToken();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkAndRefreshToken, scheduleRefresh]);

  return { refreshToken };
};
