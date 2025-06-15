/**
 * MFA Disable Module
 * Handles the disabling of two-factor authentication
 */

import { supabase } from '../../supabase';
import { USE_MOCK_AUTH } from '../config';
import { MFADisableResponse } from './types';

/**
 * Disables two-factor authentication for the current user
 * @param password User's password for verification before disabling
 */
export async function disableMFA(password: string): Promise<MFADisableResponse> {
  try {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Disabling two-factor authentication');
      
      // Simple password check for mock mode
      if (!password || password.length < 6) {
        return {
          success: false,
          message: 'Invalid password. Please try again.'
        };
      }
      
      return {
        success: true,
        message: 'Two-factor authentication has been disabled'
      };
    }
    
    console.log('Starting MFA disable process...');
    
    // First verify password by attempting a sign-in (without completing it)
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData?.session?.user?.email;
      
      if (!email) {
        throw new Error('User email not found in session');
      }
      
      // Verify password is correct by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInError) {
        console.error('Password verification failed:', signInError);
        return {
          success: false,
          message: 'Incorrect password. Please try again.'
        };
      }
    } catch (passwordError) {
      console.error('Error during password verification:', passwordError);
      return {
        success: false,
        message: 'Failed to verify password. Please try again.'
      };
    }
    
    // List all factors to find the TOTP factor to remove
    console.log('Listing MFA factors...');
    const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
    
    if (factorError) {
      console.error('Failed to list factors for disabling:', factorError);
      return {
        success: false,
        message: factorError.message || 'Failed to retrieve MFA factors'
      };
    }
    
    // Look for TOTP factors to unenroll
    const totpFactors = factorData?.all?.filter(factor => factor.factor_type === 'totp') || [];
    
    if (totpFactors.length === 0) {
      console.log('No TOTP factors found to disable');
      
      // Update metadata anyway to ensure consistency
      try {
        await supabase.auth.updateUser({
          data: { 
            mfaEnabled: false,
            mfaVerifiedAt: null
          }
        });
      } catch (updateError) {
        console.error('Failed to update user metadata:', updateError);
      }
      
      return {
        success: true,
        message: 'Two-factor authentication was already disabled'
      };
    }
    
    // Unenroll all TOTP factors
    console.log(`Found ${totpFactors.length} TOTP factors to disable`);
    
    for (const factor of totpFactors) {
      try {
        console.log(`Unenrolling factor ${factor.id}...`);
        await supabase.auth.mfa.unenroll({
          factorId: factor.id
        });
      } catch (unenrollError) {
        console.error(`Failed to unenroll factor ${factor.id}:`, unenrollError);
        // Continue with other factors
      }
    }
    
    // Update user metadata to reflect MFA disabled
    try {
      await supabase.auth.updateUser({
        data: { 
          mfaEnabled: false,
          mfaVerifiedAt: null
        }
      });
      console.log('Updated user metadata with MFA disabled status');
    } catch (updateError) {
      console.error('Failed to update user metadata:', updateError);
      // Continue anyway as the MFA is still disabled at the factor level
    }
    
    return {
      success: true,
      message: 'Two-factor authentication has been successfully disabled'
    };
  } catch (error) {
    console.error('MFA disable failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}
