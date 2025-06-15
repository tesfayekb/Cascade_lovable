/**
 * MFA Enrollment Module
 * Handles two-factor authentication enrollment process
 */

import { supabase } from '../../supabase';
import { MFAEnrollResponse } from '../../../types/auth';
import { USE_MOCK_AUTH, MOCK_SECRET } from '../config';

// Track the manual entry code for external access
let currentManualEntryCode: string | null = null;

// Export the current manual entry code for use by the MFA service
export const getManualEntryCode = () => currentManualEntryCode;

/**
 * Handles the MFA enrollment process
 * Creates a TOTP factor and generates QR code for authenticator apps
 */
export async function enrollMFA(): Promise<MFAEnrollResponse> {
  try {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Enrolling in two-factor authentication');
      
      // Generate a mock QR code URL using QR Server API which has better CORS support
      const otpauthURL = encodeURIComponent(`otpauth://totp/TailAdmin:user@example.com?secret=${MOCK_SECRET}&issuer=TailAdmin`);
      const mockQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${otpauthURL}`;
      
      // Set the manual entry code for display in the UI
      currentManualEntryCode = MOCK_SECRET;
      
      return {
        secret: MOCK_SECRET,
        qrCode: mockQrCodeUrl
      };
    }
    
    // Get the current authentication session
    console.log('Getting current session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      throw new Error(sessionError.message || 'Failed to get authentication session');
    }
    
    // Verify we have a valid session
    if (!sessionData?.session) {
      console.error('No valid session found');
      throw new Error('You must be logged in to enable two-factor authentication. Please sign in again.');
    }
    
    // Check if user already has MFA enabled in their metadata
    const userMetadata = sessionData?.session?.user?.user_metadata || {};
    
    if (userMetadata.mfaEnabled === true) {
      console.log('User already has MFA enabled according to metadata');
      throw new Error('Two-factor authentication is already enabled for your account');
    }

    // Try a different approach to get factors
    console.log('Checking existing MFA factors...');
    const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();
    
    if (factorError) {
      console.error('Error checking MFA factors:', factorError);
      throw new Error(factorError.message || 'Failed to check existing factors');
    }

    // Debug the existing factors
    console.log('Existing factors:', factorData);
    
    // Try to clean up any existing factors regardless of what's shown in the list
    // Sometimes Supabase has factors that don't appear in the listing
    try {
      if (factorData?.all && factorData.all.length > 0) {
        console.log('Found existing factors in all[], attempting cleanup...');
        
        for (const factor of factorData.all) {
          console.log(`Attempting to unenroll factor ${factor.id}`);
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
        }
      }
    } catch (cleanupErr) {
      console.error('Error during factor cleanup:', cleanupErr);
      // Continue anyway and let the next step fail if needed
    }
    
    // Generate a unique name for the factor to avoid conflicts
    const timestamp = new Date().getTime();
    const factorName = `TailAdmin 2FA ${timestamp}`;
    
    // Use Supabase to enroll in MFA
    console.log(`Enrolling in MFA with Supabase using name: ${factorName}`);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'TailAdmin',
      friendlyName: factorName
    });
    
    // Debug what we got from Supabase
    console.log('MFA enrollment response:', {
      data: data ? {
        totpAvailable: !!data.totp,
        secret: data.totp?.secret?.substring(0, 5) + '...',
        qrCode: data.totp?.qr_code?.substring(0, 30) + '...',
        qrCodeLength: data.totp?.qr_code?.length
      } : null,
      error
    });
    
    // Check for the specific "already exists" error
    if (error && error.message && error.message.includes('already exists')) {
      console.log('Got "already exists" error - treating as if 2FA is already enabled');
      
      // Update user metadata to reflect 2FA is enabled
      try {
        await supabase.auth.updateUser({
          data: { mfaEnabled: true }
        });
        console.log('Updated user metadata to indicate 2FA is enabled');
      } catch (updateErr) {
        console.error('Failed to update user metadata:', updateErr);
      }
      
      throw new Error('Two-factor authentication appears to already be set up for your account');
    }
    
    if (error || !data || !data.totp) {
      throw new Error(error?.message || 'Failed to enroll in two-factor authentication');
    }
    
    let qrCodeUrl: string;
    
    // ALWAYS override Supabase's QR code and generate our own to ensure it works
    // This guarantees compatibility with authenticator apps and dark mode display
    try {
      console.log('Original QR code from Supabase:', data.totp.qr_code ? data.totp.qr_code.substring(0, 50) + '...' : 'undefined');
      console.log('Secret from Supabase:', data.totp.secret ? '***PRESENT***' : 'undefined');
      
      if (!data.totp.secret) {
        throw new Error('No secret provided by Supabase for QR code generation');
      }
      
      // Get current user's email from Supabase session for better identification
      let userEmail = 'user@example.com';
      try {
        userEmail = sessionData?.session?.user?.email || 'user@example.com';
      } catch {  // Deliberately ignoring error as we have a fallback
        console.warn('Could not get user email for QR code, using default');
      }
      
      // Add timestamp to make factor identifiable and unique in authenticator apps
      const timestamp = new Date().getTime();
      
      // Format a proper TOTP URI
      const issuer = encodeURIComponent(`TailAdmin-${timestamp}`);
      const email = encodeURIComponent(userEmail);
      const secret = encodeURIComponent(data.totp.secret);
      
      // Create a proper otpauth:// URL
      const totpUri = `otpauth://totp/${issuer}:${email}?secret=${secret}&issuer=${issuer}`;
      
      // We'll try both Google Charts and a direct data URI approach
      // Use QR Server API instead of Google Charts for better CORS support
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(totpUri)}`;
      
      console.log('Generated new QR code URL with proper TOTP URI format');
      console.log(`TOTP URI: ${totpUri.substring(0, 40)}...`);
      console.log(`QR URL: ${qrCodeUrl.substring(0, 60)}...`);
    } catch (qrCodeErr) {
      console.error('Error generating QR code:', qrCodeErr);
      // Super reliable fallback using QR Server API for better CORS support
      const backupSecret = data.totp.secret || 'FAILED_TO_RETRIEVE_SECRET';
      const totpUri = `otpauth://totp/TailAdmin:Backup?secret=${encodeURIComponent(backupSecret)}&issuer=TailAdmin`;
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(totpUri)}`;
      currentManualEntryCode = backupSecret;
    }
    
    return {
      secret: data.totp.secret,
      qrCode: qrCodeUrl
      // Note: manualEntryCode is stored separately and returned via mfaService.currentManualEntryCode
    };
  } catch (error) {
    console.error('MFA enrollment failed:', error);
    throw error;
  }
}
