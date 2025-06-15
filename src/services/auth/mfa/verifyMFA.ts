/**
 * MFA Verification Module
 * Handles the verification of two-factor authentication codes
 */

import { supabase } from '../../supabase';
import { MFAVerifyResponse, RecoveryCode } from '../../../types/auth';
import { USE_MOCK_AUTH, UUID_REGEX } from '../config';

/**
 * Verifies a TOTP code for MFA verification
 * @param code The 6-digit verification code from authenticator app
 */
export async function verifyMFA(code: string): Promise<MFAVerifyResponse> {
  try {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Verifying two-factor authentication code', code);
      
      // In mock mode, accept any 6-digit code
      if (!/^\d{6}$/.test(code)) {
        return {
          success: false,
          message: 'Invalid verification code. Must be 6 digits.'
        };
      }
      
      // Generate mock recovery codes
      const mockRecoveryCodes: RecoveryCode[] = Array(10)
        .fill(0)
        .map((_, i) => ({
          code: `MOCK-${i.toString().padStart(5, '0')}`,
          used: false
        }));
      
      return {
        success: true,
        message: 'Two-factor authentication has been successfully enabled',
        recoveryCodes: mockRecoveryCodes
      };
    }
    
    console.log('Starting MFA verification process with code:', code.substring(0, 2) + '****');
    
    // List all factors to find the TOTP factor ID
    console.log('Listing MFA factors...');
    const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
    
    if (factorError) {
      console.error('Failed to list factors for verification:', factorError);
      return {
        success: false,
        message: factorError.message || 'Failed to retrieve MFA factors'
      };
    }
    
    // Debug output of raw factor data for troubleshooting
    console.log('Raw factor data:', JSON.stringify(factorData));
    
    // Find the first TOTP factor (verified or unverified)
    const totpFactor = factorData?.all?.find(factor => factor.factor_type === 'totp');
    
    if (!totpFactor) {
      console.error('No TOTP factor found for verification');
      return {
        success: false,
        message: 'No two-factor authentication setup found. Please try setting up 2FA again.'
      };
    }
    
    // Debug print the entire factor object
    console.log('Selected TOTP factor:', JSON.stringify(totpFactor));
    
    // Ensure the factor ID is a valid UUID format
    const factorId = totpFactor.id;
    console.log(`Raw factor ID: ${factorId}`);
    
    // Try to clean the factor ID if it's not already a valid UUID
    let cleanFactorId = factorId;
    
    if (!cleanFactorId || !UUID_REGEX.test(cleanFactorId)) {
      console.warn(`Factor ID isn't a standard UUID: ${factorId}`);
      
      // Try to extract a UUID pattern if it exists somewhere in the string
      const extractedUuid = factorId.match(UUID_REGEX);
      if (extractedUuid && extractedUuid[1]) {
        cleanFactorId = extractedUuid[1];
        console.log(`Extracted UUID from factor ID: ${cleanFactorId}`);
      } else {
        console.error('Could not find a valid UUID in the factor ID');
        return {
          success: false,
          message: 'Invalid authentication factor format. Please try again.'
        };
      }
    }
    
    console.log(`Using factor ID ${cleanFactorId} for verification`);
    
    // Use Supabase to verify MFA
    console.log('Creating challenge with factor ID:', cleanFactorId);
    const { data, error } = await supabase.auth.mfa.challenge({
      factorId: cleanFactorId
    });
    
    if (error || !data) {
      console.error('Failed to create MFA challenge:', error);
      return {
        success: false,
        message: error?.message || 'Failed to challenge two-factor authentication'
      };
    }
    
    console.log(`Created challenge with ID ${data.id}, verifying with provided code...`);
    
    // Verify the challenge
    const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
      factorId: cleanFactorId,
      challengeId: data.id,
      code
    });
    
    if (verifyError || !verifyData) {
      console.error('Code verification failed:', verifyError);
      return {
        success: false,
        message: verifyError?.message || 'Failed to verify the code'
      };
    }
    
    console.log('Successfully verified MFA code, updating user metadata...');
    
    // Update user metadata to track 2FA status
    try {
      await supabase.auth.updateUser({
        data: { 
          mfaEnabled: true,
          backupCodesGenerated: true,
          mfaVerifiedAt: new Date().toISOString()
        }
      });
      console.log('Updated user metadata with 2FA enabled status');
    } catch (updateError) {
      console.error('Failed to update user metadata:', updateError);
      // Continue anyway as the 2FA is still verified
    }
    
    // TODO: In a real implementation, we would retrieve recovery codes from the API
    // For now, we'll generate mock recovery codes
    const recoveryCodesArray: RecoveryCode[] = Array(10)
      .fill(0)
      .map((_, i) => ({
        code: `RECOVER-${Math.random().toString(36).substring(2, 7)}-${i}`,
        used: false
      }));
    
    return {
      success: true,
      message: 'Two-factor authentication has been successfully enabled',
      recoveryCodes: recoveryCodesArray
    };
  } catch (error) {
    console.error('MFA verification failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}
