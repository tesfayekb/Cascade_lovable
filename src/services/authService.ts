/**
 * Authentication Service
 * Provides functionality for handling authentication operations with Supabase
 * Implements token refresh strategy with 30-minute access tokens
 * 
 * This file serves as an integration point for the modularized auth services
 */

// Import supabase client
import { supabase } from './supabase';

// Internal imports from modular services
import { TokenService } from './auth/tokenService';
import { AuthenticationService } from './auth/authenticationService';
import { UserService } from './auth/userService';
import { MFAService } from './auth/mfa/mfaService';

// Import types
import {
  LoginCredentials,
  LoginResponse,
  RegisterData,
  RoleSwitchResponse,
  SecurityPreferences,
  TenantSwitchResponse,
  TokenResponse,
  User,
  MFAEnrollResponse,
  MFAVerifyResponse
} from '../types/auth';

// No need to import USE_MOCK_AUTH here as it's used in the delegated services

class AuthService {
  // Core service instances
  private tokenService: TokenService;
  private authService: AuthenticationService;
  private userService: UserService;
  private mfaService: MFAService;
  
  constructor() {
    // Initialize service instances
    this.tokenService = new TokenService(supabase);
    this.userService = new UserService();
    this.authService = new AuthenticationService(this.tokenService, this.userService);
    this.mfaService = new MFAService();
  }

  /**
   * Register a new user with email and password
   * @param data Registration data including email, password and optional metadata
   */
  async register(data: RegisterData): Promise<void> {
    return this.authService.register(data);
  }
  
  /**
   * Log in with email and password
   * @param credentials Login credentials including email, password, tenant, and remember me option
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    return this.authService.login(credentials);
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    return this.authService.logout();
  }

  /**
   * Refresh the access token using the refresh token
   * @returns New token data
   */
  async refreshTokens(): Promise<TokenResponse> {
    return this.tokenService.refreshTokens();
  }
  
  /**
   * Switch to a different tenant
   * @param tenantId ID of the tenant to switch to
   */
  async switchTenant(tenantId: string): Promise<TenantSwitchResponse> {
    return this.authService.switchTenant(tenantId);
  }
  
  /**
   * Switch to a different role
   * @param roleId ID of the role to switch to
   */
  async switchRole(roleId: string): Promise<RoleSwitchResponse> {
    return this.authService.switchRole(roleId);
  }

  /**
   * Request a password reset
   * @param email Email address for password reset
   */
  async resetPassword(email: string): Promise<void> {
    return this.authService.resetPassword(email);
  }

  /**
   * Update user profile
   * @param userData Partial user data to update
   */
  async updateProfile(userData: Partial<User>): Promise<void> {
    return this.userService.updateProfile(userData);
  }

  /**
   * Impersonate another user (superadmin only)
   * @param userId ID of the user to impersonate
   */
  async impersonateUser(userId: string): Promise<LoginResponse> {
    return this.authService.impersonateUser(userId);
  }
  
  /**
   * Stop impersonating another user
   */
  async stopImpersonation(): Promise<void> {
    return this.authService.stopImpersonation();
  }

  /**
   * Get the current access token
   * @returns Current access token
   */
  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }
  
  /**
   * Enroll in two-factor authentication
   * @returns QR code and secret for authenticator app setup
   */
  async enrollMFA(): Promise<MFAEnrollResponse> {
    return this.mfaService.enrollMFA();
  }
  
  /**
   * Verify a two-factor authentication code to complete enrollment
   * @param code The verification code from the authenticator app
   * @returns Success status and any generated recovery codes
   */
  async verifyMFA(code: string): Promise<MFAVerifyResponse> {
    return this.mfaService.verifyMFA(code);
  }

  /**
   * Get the manual entry code for MFA setup
   * @returns The current manual entry code or null if not available
   */
  getManualEntryCode(): string | null {
    return this.mfaService.currentManualEntryCode;
  }

  /**
   * Get the current authentication session from Supabase
   * @returns The current session data or null if not authenticated
   */
  async getCurrentSession(): Promise<{ data: { session: any } | null, error: Error | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      return { data, error };
    } catch (error) {
      console.error('Error getting current session:', error);
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  }

  /**
   * Check if MFA is enabled for the current user
   */
  async getMFAStatus(): Promise<{ enabled: boolean; factorId?: string }> {
    return this.mfaService.getMFAStatus();
  }
  
  /**
   * Disable two-factor authentication for the current user
   * @param password User's password for verification before disabling
   * @returns Success status and message
   */
  async disableMFA(password: string): Promise<{ success: boolean; message: string }> {
    return this.mfaService.disableMFA(password);
  }
  
  /**
   * Update security preferences for the current user
   * @param preferences Security preferences to update
   */
  async updateSecurityPreferences(preferences: Partial<SecurityPreferences>): Promise<void> {
    return this.userService.updateSecurityPreferences(preferences);
  }
}

// Export singleton instance
export const authService = new AuthService();

export default authService;
