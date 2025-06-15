/**
 * MFA Service
 * Provides a unified interface for all MFA-related operations
 */

import { MFAEnrollResponse, MFAVerifyResponse } from '../../../types/auth';
import { enrollMFA } from './enrollMFA';
import { verifyMFA } from './verifyMFA';
import { disableMFA } from './disableMFA';
import { getMFAStatus } from './getMFAStatus';
import { MFADisableResponse, MFAStatusResponse, IMFAService } from './types';

/**
 * Service for handling all Multi-Factor Authentication operations
 * Manages the lifecycle of two-factor authentication for users
 */
export class MFAService implements IMFAService {
  /**
   * Store for manual entry code that can be displayed to users
   * This is provided as a fallback when QR code scanning isn't available
   */
  public currentManualEntryCode: string | null = null;
  
  /**
   * Enroll in two-factor authentication
   * @returns QR code and secret for authenticator app setup
   */
  async enrollMFA(): Promise<MFAEnrollResponse> {
    try {
      const response = await enrollMFA();
      
      // Store the manual entry code for later use
      if (response && response.secret) {
        this.currentManualEntryCode = response.secret;
      }
      
      return response;
    } catch (error) {
      console.error('MFA enrollment failed:', error);
      throw error;
    }
  }
  
  /**
   * Verify a two-factor authentication code to complete enrollment
   * @param code The verification code from the authenticator app
   * @returns Success status and any generated recovery codes
   */
  async verifyMFA(code: string): Promise<MFAVerifyResponse> {
    return verifyMFA(code);
  }
  
  /**
   * Disable two-factor authentication for the current user
   * @param password User's password for verification before disabling
   * @returns Success status and message
   */
  async disableMFA(password: string): Promise<MFADisableResponse> {
    const result = await disableMFA(password);
    if (result.success) {
      // Clear the manual entry code when MFA is disabled
      this.currentManualEntryCode = null;
    }
    return result;
  }
  
  /**
   * Check if MFA is enabled for the current user
   * @returns MFA status including whether it's enabled
   */
  async getMFAStatus(): Promise<MFAStatusResponse> {
    return getMFAStatus();
  }
}
