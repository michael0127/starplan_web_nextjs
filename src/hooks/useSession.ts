import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * Custom hook to manage Supabase session
 * Caches session and listens for auth state changes
 * 
 * @returns {Object} session and loading state
 * 
 * @example
 * const { session, loading } = useSession();
 * 
 * if (loading) return <div>Loading...</div>;
 * if (!session) return <div>Not authenticated</div>;
 * 
 * // Use session.access_token for API calls
 * fetch('/api/data', {
 *   headers: { 'Authorization': `Bearer ${session.access_token}` }
 * });
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, loading };
}

