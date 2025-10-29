import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Update the signUpUser function to include agent_id
export async function signUpUser(email: string, password: string, memberId: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // First verify member exists and get their details
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .select('member_id, first_name, last_name, product_id, product_label, product_benefit, agent_id, email')
      .eq('member_id', memberId)
      .single();

    if (memberError || !memberData) {
      throw new Error('Invalid member ID. Please verify your membership details.');
    }

    // Verify email matches (case-insensitive)
    if (memberData.email && memberData.email.toLowerCase() !== normalizedEmail) {
      throw new Error('Email does not match member record. Please use the email associated with your membership.');
    }

    // Create auth account with normalized email
    const { error: signUpError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          member_id: memberData.member_id,
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          product_id: memberData.product_id,
          product_label: memberData.product_label,
          product_benefit: memberData.product_benefit,
          agent_id: memberData.agent_id
        }
      }
    });

    if (signUpError) {
      throw signUpError;
    }

    return { success: true };
  } catch (error) {
    logger.error('Sign up error', error);
    throw error;
  }
}

export async function signInUser(email: string, password: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // First check if user exists in users table but doesn't have auth record
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, member_id, first_name, last_name, product_id, product_label, product_benefit, agent_id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (userCheckError) {
      logger.error('Error checking existing user', userCheckError);
    }

    // Try to sign in with existing auth using normalized email
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password
    });

    // If sign in failed and user exists in users table without auth, create auth record
    if (signInError && existingUser && !existingUser.id) {
      logger.info('Creating auth record for existing user', { email: normalizedEmail });

      // Create new auth account with normalized email
      const { data: newAuthData, error: createAuthError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            member_id: existingUser.member_id,
            first_name: existingUser.first_name,
            last_name: existingUser.last_name,
            product_id: existingUser.product_id,
            product_label: existingUser.product_label,
            product_benefit: existingUser.product_benefit,
            agent_id: existingUser.agent_id
          }
        }
      });

      if (createAuthError || !newAuthData.user) {
        throw new Error('Failed to create authentication record');
      }

      // Update the users table record with the new auth ID
      const { error: updateError } = await supabase
        .from('users')
        .update({ id: newAuthData.user.id })
        .eq('email', normalizedEmail);

      if (updateError) {
        logger.error('Failed to link auth record to user', updateError);
        throw new Error('Failed to link authentication record');
      }

      // Now sign in with the new auth record
      const { error: finalSignInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (finalSignInError) {
        throw finalSignInError;
      }
    } else if (!authData?.user && !signInError) {
      throw new Error('Sign in failed');
    } else if (signInError) {
      throw signInError;
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Sign in error', error);
    throw error;
  }
}

export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    logger.error('Sign out error', error);
    throw error;
  }
}

export async function resetPassword(email: string) {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    logger.error('Password reset error', error);
    throw error;
  }
}