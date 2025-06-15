/**
 * User Service
 * Handles user profile and account management operations
 */

import { supabase } from '../supabase';
import { User, SecurityPreferences } from '../../types/auth';
import { USE_MOCK_AUTH } from './config';
import { User as SupabaseUser } from '@supabase/supabase-js';

export class UserService {
  /**
   * Creates a user object from Supabase user data
   * In a real implementation, we would fetch the full user profile from the API
   * 
   * @param supabaseUser - User data from Supabase authentication
   * @returns A structured User object with properly typed data
   */
  createUserFromSupabase(supabaseUser: SupabaseUser): User {
    // Convert from Supabase user to our application user model
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      firstName: supabaseUser.user_metadata?.firstName || '',
      lastName: supabaseUser.user_metadata?.lastName || '',
      roles: [],  // Roles would come from API
      isActive: supabaseUser.confirmed_at != null,
      twoFactorEnabled: !!supabaseUser.user_metadata?.mfaEnabled,
      lastLogin: supabaseUser.last_sign_in_at ? new Date(supabaseUser.last_sign_in_at) : null,
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at || supabaseUser.created_at),
      registrationDate: new Date(supabaseUser.created_at),
      failedLoginAttempts: 0,  // Would come from API
      lastFailedLogin: null,   // Would come from API
      metadata: supabaseUser.user_metadata
    };
  }

  /**
   * Update user profile
   * @param userData Partial user data to update
   */
  async updateProfile(userData: Partial<User>): Promise<void> {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Profile update successful', userData);
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }
    
    try {
      // Extract data to be updated
      const { firstName, lastName } = userData;
      
      // Prepare metadata for Supabase
      const metadata: Record<string, string | number | boolean | null> = {};
      
      // Only include defined fields
      if (firstName !== undefined) metadata.firstName = firstName;
      if (lastName !== undefined) metadata.lastName = lastName;
      
      // Update user in Supabase
      const { error } = await supabase.auth.updateUser({
        data: metadata
      });
      
      if (error) {
        throw new Error(error.message || 'Profile update failed');
      }
      
      // For other user data fields, we would need to update them in a separate user table
      // This would be handled by a serverless function or backend API
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Update user security preferences
   * @param preferences Partial security preferences to update
   */
  async updateSecurityPreferences(preferences: Partial<SecurityPreferences>): Promise<void> {
    try {
      if (USE_MOCK_AUTH) {
        console.log('MOCK MODE: Updating security preferences', preferences);
        return;
      }
      
      // Get current user metadata
      const { data: sessionData } = await supabase.auth.getSession();
      const currentMetadata = sessionData?.session?.user?.user_metadata || {};
      
      // Prepare updated security preferences
      const updatedMetadata = { ...currentMetadata };
      
      if (preferences.multifactorAuthEnabled !== undefined) {
        updatedMetadata.mfaEnabled = preferences.multifactorAuthEnabled;
      }
      
      if (preferences.rememberDevices !== undefined) {
        updatedMetadata.rememberDevices = preferences.rememberDevices;
      }
      
      if (preferences.notifyOnNewLogin !== undefined) {
        updatedMetadata.notifyOnNewLogin = preferences.notifyOnNewLogin;
      }
      
      // Update user metadata
      const { error } = await supabase.auth.updateUser({
        data: updatedMetadata
      });
      
      if (error) {
        throw new Error(error.message || 'Security preferences update failed');
      }
    } catch (error) {
      console.error('Security preferences update failed:', error);
      throw error;
    }
  }
}
