/**
 * Authentication Service
 * Core authentication functionality for login, registration, and session management
 */

import { supabase } from '../supabase';
import {
  LoginCredentials,
  LoginResponse,
  RegisterData,
  AuthTokens,
  User,
  TenantSwitchResponse,
  RoleSwitchResponse
} from '../../types/auth';
import { USE_MOCK_AUTH } from './config';
import { TokenService } from './tokenService';
import { UserService } from './userService';

/**
 * Service for core authentication operations
 * Handles login, registration, and session management
 */
export class AuthenticationService {
  private tokenService: TokenService;
  private userService: UserService;

  constructor(tokenService: TokenService, userService: UserService) {
    this.tokenService = tokenService;
    this.userService = userService;
  }
  
  /**
   * Register a new user with email and password
   * @param data Registration data including email, password and optional metadata
   */
  async register(data: RegisterData): Promise<void> {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Registration successful', data);
      // Simulate a slight delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }
    
    try {
      const { email, password, meta } = data;
      
      // Use Supabase authentication to sign up
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: meta || {}
        }
      });
      
      if (error) {
        throw new Error(error.message || 'Registration failed');
      }
      
      // Return success, user will need to verify their email
      return;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }
  
  /**
   * Log in with email and password
   * @param credentials Login credentials including email, password, tenant, and remember me option
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Authentication successful', credentials);
      
      // Simulate a slight delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Return mock data
      const mockUser: User = {
        id: 'mock-user-123',
        email: credentials.email,
        firstName: 'Mock',
        lastName: 'User',
        metadata: {
          avatarUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
        },
        roles: [
          {
            id: 'admin',
            name: 'Admin',
            description: 'Administrator role',
            isSystemRole: true,
            permissions: []
          }
        ],
        isActive: true,
        twoFactorEnabled: false,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        registrationDate: new Date(),
        failedLoginAttempts: 0,
        lastFailedLogin: null
      };
      
      // Create token with 30-minute expiration
      const expiresIn = 1800; // 30 minutes
      const expiresAt = Date.now() + expiresIn * 1000;
      
      const mockTokens: AuthTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn,
        expiresAt
      };
      
      // Set tokens in token service
      this.tokenService.setTokens(mockTokens);
      
      return {
        user: mockUser,
        tenant: null,
        tokens: mockTokens,
        availableRoles: [mockUser.roles[0]],
        availableTenants: []
      };
    }
    
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });
      
      if (error || !data?.session || !data.user) {
        throw new Error(error?.message || 'Authentication failed');
      }
      
      // Extract token information
      const expiresIn = data.session.expires_in || 1800; // Default 30 minutes
      const expiresAt = Date.now() + expiresIn * 1000;
      
      // Create token response
      const tokens: AuthTokens = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn,
        expiresAt
      };
      
      // Set tokens in token service
      this.tokenService.setTokens(tokens);
      
      // Convert to our User model
      const user = this.userService.createUserFromSupabase(data.user);
      
      // In a real implementation, we would fetch available roles and tenants
      // For now, create a simple response
      return {
        user,
        tenant: null, // Would be fetched from API
        tokens,
        availableRoles: user.roles || [],
        availableTenants: [] // Would be fetched from API
      };
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }
  
  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Logout successful');
      // Simulate a slight delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Clear token refresh timer
      this.tokenService.clearTokenRefreshTimer();
      
      return;
    }
    
    try {
      // Use Supabase to sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message || 'Logout failed');
      }
      
      // Clear token refresh timer
      this.tokenService.clearTokenRefreshTimer();
      
      return;
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }
  
  /**
   * Switch to a different tenant
   * @param tenantId ID of the tenant to switch to
   */
  async switchTenant(tenantId: string): Promise<TenantSwitchResponse> {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Tenant switch successful', tenantId);
      
      // Return mock data
      return {
        tenant: {
          id: tenantId,
          name: `Tenant ${tenantId}`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        availableRoles: [
          {
            id: 'user',
            name: 'User',
            description: 'Standard user role',
            tenantId,
            isSystemRole: false,
            permissions: []
          }
        ]
      };
    }
    
    // In a real implementation, we would make an API call to switch tenant
    // and then update the user's session with new tenant information
    throw new Error('Tenant switching not implemented in this version');
  }
  
  /**
   * Switch to a different role
   * @param roleId ID of the role to switch to
   */
  async switchRole(roleId: string): Promise<RoleSwitchResponse> {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Role switch successful', roleId);
      
      // Return mock data
      return {
        role: {
          id: roleId,
          name: `Role ${roleId}`,
          description: 'Standard role',
          isSystemRole: false,
          permissions: []
        }
      };
    }
    
    // In a real implementation, we would make an API call to switch role
    // and then update the user's session with new role information
    throw new Error('Role switching not implemented in this version');
  }
  
  /**
   * Request a password reset
   * @param email Email address for password reset
   */
  async resetPassword(email: string): Promise<void> {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Password reset email sent to', email);
      // Simulate a slight delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }
    
    try {
      // Use Supabase to send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password'
      });
      
      if (error) {
        throw new Error(error.message || 'Password reset request failed');
      }
      
      return;
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  }
  
  /**
   * Impersonate another user (superadmin only)
   * @param userId ID of the user to impersonate
   */
  async impersonateUser(userId: string): Promise<LoginResponse> {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Impersonation successful', userId);
      
      // Return mock data for impersonated user
      const mockUser: User = {
        id: userId,
        email: `user-${userId}@example.com`,
        firstName: 'Impersonated',
        lastName: 'User',
        metadata: {
          avatarUrl: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
          impersonatedBy: 'admin-user-id'
        },
        roles: [
          {
            id: 'user',
            name: 'User',
            description: 'Standard user role',
            isSystemRole: true,
            permissions: []
          }
        ],
        isActive: true,
        twoFactorEnabled: false,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        registrationDate: new Date(),
        failedLoginAttempts: 0,
        lastFailedLogin: null
      };
      
      // Create token with 30-minute expiration
      const expiresIn = 1800; // 30 minutes
      const expiresAt = Date.now() + expiresIn * 1000;
      
      const mockTokens: AuthTokens = {
        accessToken: 'mock-impersonation-token',
        refreshToken: 'mock-impersonation-refresh-token',
        expiresIn,
        expiresAt
      };
      
      // Set tokens in token service
      this.tokenService.setTokens(mockTokens);
      
      return {
        user: mockUser,
        tenant: null,
        tokens: mockTokens,
        availableRoles: [mockUser.roles[0]],
        availableTenants: []
      };
    }
    
    // In a real implementation, we would make an API call to impersonate user
    // This would involve backend support for impersonation tokens
    throw new Error('User impersonation not implemented in this version');
  }
  
  /**
   * Stop impersonating another user
   */
  async stopImpersonation(): Promise<void> {
    if (USE_MOCK_AUTH) {
      console.log('MOCK MODE: Stopped impersonation');
      // Simulate a slight delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return;
    }
    
    // In a real implementation, we would make an API call to stop impersonation
    // and restore the original user's session
    throw new Error('Stop impersonation not implemented in this version');
  }
}
