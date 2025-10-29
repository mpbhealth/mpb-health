import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, AuthError } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { logger } from '@/lib/logger';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        // Add delay on iOS to ensure AsyncStorage is ready
        if (Platform.OS === 'ios') {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          logger.error('Initial session error', error);
          setSession(null);
          setLoading(false);
          return;
        }

        logger.debug('Initial session loaded', { hasSession: !!session });
        setSession(session);
        setLoading(false);
      } catch (error) {
        logger.error('Session initialization error', error);
        setSession(null);
        setLoading(false);
      }
    };
    
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.logAuthEvent(`State change: ${event}`, session?.user?.id, { hasSession: !!session });
      setSession(session);
      
      // Handle specific auth events
      if (event === 'SIGNED_OUT') {
        setSession(null);
      } else if (event === 'SIGNED_IN' && session) {
        setSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();
      logger.logAuthEvent('Sign in attempt', undefined, { email: normalizedEmail });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        logger.error('Supabase auth error', error, { email: normalizedEmail });
        throw error;
      }
      
      if (!data.user) {
        throw new Error('No user returned from authentication');
      }
      
      logger.logAuthEvent('Sign in successful', data.user?.id);
      return data;
      
    } catch (error) {
      logger.error('Sign in failed', error);
      throw error;
    }
  };

  const signUp = async ({ email, password, memberId }: { email: string; password: string; memberId: string }) => {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // First verify member exists and get their details (using normalized email)
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('member_id, first_name, last_name, product_id, product_label, product_benefit, agent_id, email')
        .eq('member_id', memberId)
        .single();

      if (memberError || !memberData) {
        throw new Error('Invalid member ID. Please verify your membership details.');
      }

      // Verify email matches (case-insensitive since DB now auto-lowercases)
      if (memberData.email && memberData.email.toLowerCase() !== normalizedEmail) {
        throw new Error('Email does not match member record. Please use the email associated with your membership.');
      }

      // Create auth account with normalized email
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (signUpError || !authData.user) {
        throw signUpError || new Error('Failed to create user account');
      }

      // Insert into users table with normalized email
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: normalizedEmail,
          member_id: memberData.member_id,
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          product_id: memberData.product_id,
          product_label: memberData.product_label,
          product_benefit: memberData.product_benefit,
          agent_id: memberData.agent_id
        });

      if (profileError) {
        // If profile creation fails, we should delete the auth user to maintain consistency
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error('Failed to create user profile. Please try again.');
      }

      // Add delay to ensure user insert is fully committed on mobile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Delete the member record from members table using normalized email
      logger.info('Attempting to delete member record', { memberId: memberData.member_id, email: normalizedEmail });
      
      // Try multiple deletion strategies for mobile reliability
      let deleteSuccess = false;
      
      // Strategy 1: Basic deletion
      const { error: deleteError1 } = await supabase
        .from('members')
        .delete()
        .eq('member_id', memberData.member_id.trim());
      
      if (!deleteError1) {
        logger.debug('Basic deletion successful');
        deleteSuccess = true;
      } else {
        logger.warn('Basic deletion failed', deleteError1);
      }
      
      // Strategy 2: If basic deletion failed, try with product_id match
      if (!deleteSuccess) {
        const { error: deleteError2 } = await supabase
          .from('members')
          .delete()
          .eq('member_id', memberData.member_id.trim())
          .eq('product_id', memberData.product_id);
        
        if (!deleteError2) {
          logger.debug('Product ID deletion successful');
          deleteSuccess = true;
        } else {
          logger.warn('Product ID deletion failed', deleteError2);
        }
      }
      
      // Strategy 3: Force deletion with all available fields
      if (!deleteSuccess) {
        const { error: deleteError3 } = await supabase
          .from('members')
          .delete()
          .eq('member_id', memberData.member_id.trim())
          .eq('first_name', memberData.first_name)
          .eq('last_name', memberData.last_name)
          .eq('product_id', memberData.product_id);
        
        if (!deleteError3) {
          logger.debug('Force deletion successful');
          deleteSuccess = true;
        } else {
          logger.error('Force deletion failed', deleteError3);
        }
      }
      
      // Final verification - check if record still exists
      const { data: remainingMember, error: checkError } = await supabase
        .from('members')
        .select('member_id')
        .eq('member_id', memberData.member_id.trim())
        .maybeSingle();
      
      if (!checkError && remainingMember) {
        logger.error('Critical: Member record still exists after deletion', undefined, { memberId: memberData.member_id });
        // Log this for manual cleanup but don't fail the user creation
      } else {
        logger.info('Member record successfully deleted', { memberId: memberData.member_id });
      }
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  return {
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };
}