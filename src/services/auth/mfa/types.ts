/**
 * MFA Types and Interfaces
 * Supplementary types specific to MFA implementation
 */

import { RecoveryCode } from '../../../types/auth';

/**
 * Interface for MFA status check response
 */
export interface MFAStatusResponse {
  enabled: boolean;
  verified: boolean;
  pendingVerification: boolean;
  enrollmentDate?: string;
  factorId?: string;
  backupCodesAvailable?: boolean;
  message?: string;
}

/**
 * Interface for MFA disable response
 */
export interface MFADisableResponse {
  success: boolean;
  message: string;
}

/**
 * Interface for full MFA service with all related operations
 */
export interface IMFAService {
  enrollMFA(): Promise<MFAEnrollResponse>;
  verifyMFA(code: string): Promise<MFAVerifyResponse>;
  disableMFA(password: string): Promise<MFADisableResponse>;
  getMFAStatus(): Promise<MFAStatusResponse>;
  currentManualEntryCode: string | null;
}

/**
 * Extended definition of Supabase Factor to include verified property
 */
export interface Factor {
  id: string;
  friendly_name?: string;
  factor_type: string;
  status?: string;
  verified?: boolean; 
}

export interface MFAEnrollResponse {
  qrCode: string;
  secret: string;
  manualEntryCode?: string; 
}

export interface MFAVerifyResponse {
  success: boolean;
  message?: string;
  recoveryCodes?: RecoveryCode[];
}
