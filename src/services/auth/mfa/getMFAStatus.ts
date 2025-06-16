/**
 * MFA Status Module
 * Checks the current status of two-factor authentication for the user
 */

import { supabase } from '../../supabase';
import { USE_MOCK_AUTH } from '../config';
import { MFAStatusResponse, Factor } from './types';

/**
 * Gets the current MFA status for the logged in user
 * @returns Status information about MFA configuration
 */
export async function getMFAStatus(): Promise<MFAStatusResponse> {
  try {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Checking two-factor authentication status');
      
      return {
        enabled: false,
        verified: false,
        pendingVerification: false,
        factorId: undefined,
        enrollmentDate: undefined,
        backupCodesAvailable: false
      };
    }
    
    // Check user metadata first as this is the source of truth for enabling status
    const { data: sessionData } = await supabase.auth.getSession();
    const userMetadata = sessionData?.session?.user?.user_metadata || {};
    
    // If metadata shows MFA is enabled, we'll trust that first
    if (userMetadata.mfaEnabled === true) {
      return {
        enabled: true,
        verified: true,
        pendingVerification: false,
        factorId: undefined,
        enrollmentDate: userMetadata.mfaVerifiedAt || new Date().toISOString(),
        backupCodesAvailable: userMetadata.backupCodesGenerated === true
      };
    }
    
    // Double-check with the factors API to make sure
    const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
    
    if (factorError) {
      console.error('Failed to list factors for status check:', factorError);
      return {
        enabled: false,
        verified: false,
        pendingVerification: false,
        factorId: undefined,
        enrollmentDate: undefined,
        backupCodesAvailable: false
      };
    }
    
    // Look for active, verified TOTP factors
    const verifiedTotpFactor = factorData?.totp?.find((factor: Factor) => factor.status === 'verified');
    
    if (verifiedTotpFactor) {
      // Check metadata for possible discrepancies
      if (userMetadata.mfaEnabled === false) {
        console.log('Metadata shows MFA disabled but verified factor found - respecting user disable intent');
        console.log('Orphaned factor ID:', verifiedTotpFactor.id);
        
        return {
          enabled: false,
          verified: false,
          pendingVerification: false,
          factorId: undefined,
          enrollmentDate: undefined,
          backupCodesAvailable: false
        };
      } else if (userMetadata.mfaEnabled !== true) {
        console.log('Metadata missing but verified factor found - updating metadata to reflect MFA enabled');
        try {
          await supabase.auth.updateUser({
            data: { 
              mfaEnabled: true,
              mfaVerifiedAt: new Date().toISOString()
            }
          });
        } catch (updateError) {
          console.error('Failed to update user metadata:', updateError);
          // Continue anyway as we still want to return correct status
        }
      }
      
      return {
        enabled: true,
        verified: true,
        pendingVerification: false,
        factorId: verifiedTotpFactor.id,
        enrollmentDate: new Date().toISOString(),
        backupCodesAvailable: userMetadata.backupCodesGenerated === true
      };
    }
    
    // No verified factors found, but let's check for unverified ones
    const unverifiedTotpFactor = factorData?.all?.find(factor => 
      factor.factor_type === 'totp' && factor.status !== 'verified'
    );
    
    if (unverifiedTotpFactor) {
      return {
        enabled: false,
        verified: false,
        pendingVerification: false,
        factorId: unverifiedTotpFactor.id
      };
    }
    
    // No factors found at all
    return {
      enabled: false,
      verified: false,
      pendingVerification: false
    };
  } catch (error) {
    console.error('MFA status check failed:', error);
    return {
      enabled: false,
      verified: false,
      pendingVerification: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
}
