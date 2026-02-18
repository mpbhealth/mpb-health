import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, AuthChangeEvent, Session } from '@supabase/supabase-js';

function normalizeProductId(productId: string | null | undefined): string | null {
  if (!productId) return null;
  if (productId === '47182') return '42464';
  return productId;
}

export function useUserData() {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        // Reset error state at the start of each fetch attempt
        setError(null);

        // First check if we have a valid session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error('Session error');
        }

        // If no session exists, set appropriate states and return early
        if (!session) {
          setUserData(null);
          setLoading(false);
          return;
        }

        // Now that we know we have a session, get the user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          throw new Error('Authentication error');
        }

        if (!user) {
          setUserData(null);
          return;
        }

        const { data, error: dbError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle no results gracefully

        if (dbError) {
          throw new Error('Error fetching user data');
        }

        // Normalize product_id if needed (treat 47182 as 42464)
        if (data) {
          const normalizedData = {
            ...data,
            normalized_product_id: normalizeProductId(data.product_id),
            is_staff_essentials: data.product_id === '47182',
          };
          setUserData(normalizedData);
        } else {
          setUserData(data);
        }

      } catch (err) {
        console.error('Error in useUserData:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setUserData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, _session: Session | null) => {
      if (event === 'SIGNED_OUT') {
        setUserData(null);
        setError(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserData();
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    userData,
    loading,
    error
  };
}