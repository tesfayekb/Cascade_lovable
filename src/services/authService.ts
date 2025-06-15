/**
 * Authentication Service
 * Provides functionality for handling authentication operations with Supabase
 * Implements token refresh strategy with 30-minute access tokens
 */

// External imports
import { User as SupabaseUser } from '@supabase/supabase-js';

// Internal imports
import { supabase } from './supabase';
import {
  AuthTokens,
  LoginCredentials,
  LoginResponse,
  RegisterData,
  RoleSwitchResponse,
  TenantSwitchResponse,
  TokenResponse,
  User
} from '../types/auth';

// Token refresh threshold: 75% of token lifetime (22.5 minutes for 30-minute tokens)
const TOKEN_REFRESH_THRESHOLD = 0.75;

// Enable this for development without a real Supabase backend
const USE_MOCK_AUTH = true;

class AuthService {
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;
  private tokenExpiresAt: number = 0;
  private refreshTimerId: number | null = null;

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
        createdAt: new Date(),
        updatedAt: new Date(),
        registrationDate: new Date(),
        lastLogin: null,
        failedLoginAttempts: 0,
        lastFailedLogin: null,
        roles: [],
        twoFactorEnabled: false,
        isActive: true,
        securityPreferences: {
          multifactorAuthEnabled: false,
          backupCodesGenerated: false,
          rememberDevices: true,
          notifyOnNewLogin: false
        },
      };
      
      // Mock token expiration in 30 minutes
      const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60;
      
      this.setTokens({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 1800,
        expiresAt
      });

      // In a real implementation, we would make additional API calls to get user roles, 
      // tenant info and other data. For now, we'll mock this data.

      // Mock user data (in real app, this would come from an API call)
      const mockUserRoles = [
        {
          id: 'role-1',
          name: 'User',
          description: 'Default user role',
          isSystemRole: true,
          permissions: [
            { resource: 'profile', action: 'view' },
            { resource: 'profile', action: 'edit' }
          ]
        }
      ];

      // Mock tenant data
      const mockTenant = credentials.tenantId 
        ? { 
            id: credentials.tenantId, 
            name: `Tenant ${credentials.tenantId}`, 
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          } 
        : null;
        
      // Mock available tenants
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Demo Company',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Safely handle token expiration dates with proper type checking
      const expiresAtTime = expiresAt;
      
      return {
        user: mockUser,
        tenant: mockTenant,
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 1800, // Default to 30 mins if undefined
          expiresAt: expiresAtTime
        },
        availableRoles: mockUserRoles,
        availableTenants: mockTenants
      };
    }
    
    try {
      const { email, password } = credentials;
      
      // Use Supabase authentication
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // Ensure we have a valid session
      if (!authData.session) {
        throw new Error('Authentication successful but no session was created');
      }

      if (error) {
        throw new Error(error.message);
      }

      // Set up tokens from Supabase response - we've already validated session exists
      const expiresAtTime = new Date(authData.session.expires_at || Date.now() + authData.session.expires_in * 1000).getTime();
      
      this.setTokens({
        accessToken: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        expiresIn: authData.session.expires_in,
        expiresAt: expiresAtTime
      });

      // In a real implementation, we would make additional API calls to get user roles, 
      // tenant info and other data. For now, we'll mock this data.

      // Mock user data (in real app, this would come from an API call)
      const mockUser = authData.user ? this.createMockUserFromSupabase(authData.user) : null;
      
      if (!mockUser) {
        throw new Error('No user data returned from authentication');
      }
      
      // Mock tenant data
      const mockTenant = credentials.tenantId 
        ? { 
            id: credentials.tenantId, 
            name: `Tenant ${credentials.tenantId}`, 
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          } 
        : null;
        
      // Mock roles data
      const mockRoles = [
        {
          id: 'role-1',
          name: 'User',
          description: 'Default user role',
          isSystemRole: true,
          permissions: [
            { resource: 'profile', action: 'view' },
            { resource: 'profile', action: 'edit' }
          ]
        }
      ];

      // Mock available tenants
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Demo Company',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Safely handle token expiration dates with proper type checking
      const expiresAt = authData.session?.expires_at ? 
        new Date(authData.session.expires_at).getTime() : 
        Date.now() + (authData.session?.expires_in || 1800) * 1000;
      
      return {
        user: mockUser,
        tenant: mockTenant,
        tokens: {
          accessToken: authData.session?.access_token || '',
          refreshToken: authData.session?.refresh_token || '',
          expiresIn: authData.session?.expires_in || 1800, // Default to 30 mins if undefined
          expiresAt: expiresAt
        },
        availableRoles: mockRoles,
        availableTenants: mockTenants
      };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      // Clear the token refresh timer
      this.clearTokenRefreshTimer();
      
      // Clear tokens
      this.accessToken = null;
      this.refreshTokenValue = null;
      this.tokenExpiresAt = 0;
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  /**
   * Refresh the access token using the refresh token
   * @returns New token data
   */
  async refreshToken(): Promise<TokenResponse> {
    try {
      // Use Supabase to refresh the token
      const { data, error } = await supabase.auth.refreshSession();

      if (error || !data.session) {
        throw new Error(error?.message || 'Failed to refresh token');
      }
      
      // Calculate expiration timestamp safely
      const expiresAt = data.session.expires_at ? 
        new Date(data.session.expires_at).getTime() : 
        Date.now() + data.session.expires_in * 1000;
        
      // Update tokens in storage
      this.setTokens({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in,
        expiresAt
      });

      return {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn: data.session.expires_in
      };
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }
  
  /**
   * Switch to a different tenant
   * @param tenantId ID of the tenant to switch to
   */
  async switchTenant(tenantId: string): Promise<TenantSwitchResponse> {
    try {
      // In a real implementation, we would make API call to switch tenant context
      // For now, we'll mock the response
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
            id: 'role-1',
            name: 'User',
            description: 'Default user role',
            tenantId: tenantId,
            isSystemRole: false,
            permissions: [
              { resource: 'profile', action: 'view', tenantId },
              { resource: 'profile', action: 'edit', tenantId }
            ]
          }
        ]
      };
    } catch (error) {
      console.error('Tenant switch failed:', error);
      throw error;
    }
  }
  
  /**
   * Switch to a different role
   * @param roleId ID of the role to switch to
   */
  async switchRole(roleId: string): Promise<RoleSwitchResponse> {
    try {
      // In a real implementation, we would make API call to switch role
      // For now, we'll mock the response
      return {
        role: {
          id: roleId,
          name: `Role ${roleId}`,
          description: 'Role description',
          isSystemRole: false,
          permissions: [
            { resource: 'profile', action: 'view' },
            { resource: 'profile', action: 'edit' }
          ]
        }
      };
    } catch (error) {
      console.error('Role switch failed:', error);
      throw error;
    }
  }

  /**
   * Request a password reset
   * @param email Email address for password reset
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param userData Partial user data to update
   */
  async updateProfile(userData: Partial<User>): Promise<void> {
    try {
      // In a real implementation, we would make API call to update profile
      // For now, we'll just log the update
      console.log('Updating profile:', userData);
      
      // Supabase update user (limited to what Supabase supports)
      const updateData: any = {};
      
      if (userData.email) updateData.email = userData.email;
      if (userData.firstName || userData.lastName) {
        updateData.data = {
          ...(userData.firstName && { firstName: userData.firstName }),
          ...(userData.lastName && { lastName: userData.lastName }),
        };
      }
      
      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase.auth.updateUser(updateData);
        
        if (error) {
          throw new Error(error.message);
        }
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }

  /**
   * Impersonate another user (superadmin only)
   * @param userId ID of the user to impersonate
   */
  async impersonateUser(userId: string): Promise<LoginResponse> {
    try {
      // In a real implementation, we would make API call to impersonate user
      // For now, we'll mock the response
      
      // Mock impersonated user data
      const mockUser = {
        id: userId,
        email: `user-${userId}@example.com`,
        firstName: 'Impersonated',
        lastName: 'User',
        roles: [
          {
            id: 'role-2',
            name: 'Standard User',
            description: 'Standard user role',
            isSystemRole: true,
            permissions: [
              { resource: 'profile', action: 'view' },
              { resource: 'profile', action: 'edit' }
            ]
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
      
      // We don't actually change the Supabase session when impersonating
      // The frontend will maintain the impersonation state
      
      return {
        user: mockUser,
        tenant: {
          id: 'tenant-1',
          name: 'Demo Company',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        tokens: {
          accessToken: this.accessToken || '',
          refreshToken: this.refreshTokenValue || '',
          expiresIn: 1800, // 30 minutes
          expiresAt: this.tokenExpiresAt
        },
        availableRoles: [
          {
            id: 'role-2',
            name: 'Standard User',
            description: 'Standard user role',
            isSystemRole: true,
            permissions: [
              { resource: 'profile', action: 'view' },
              { resource: 'profile', action: 'edit' }
            ]
          }
        ],
        availableTenants: [
          {
            id: 'tenant-1',
            name: 'Demo Company',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };
    } catch (error) {
      console.error('User impersonation failed:', error);
      throw error;
    }
  }
  
  /**
   * Stop impersonating another user
   */
  async stopImpersonation(): Promise<void> {
    try {
      // In a real implementation, we would make API call to stop impersonation
      // For now, we'll just log the action
      console.log('Stopping impersonation');
      
      // The front-end will handle restoring the original user state
    } catch (error) {
      console.error('Stop impersonation failed:', error);
      throw error;
    }
  }

  /**
   * Get the current access token
   * @returns Current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }
  
  /**
   * Creates a user object from Supabase user data
   * In a real implementation, we would fetch the full user profile from the API
   * 
   * @param supabaseUser - User data from Supabase authentication
   * @returns A structured User object with properly typed data
   */
  private createMockUserFromSupabase(supabaseUser: SupabaseUser): User {
    if (!supabaseUser) {
      throw new Error('No user data available');
    }
    
    // Extract name from user metadata or use email as fallback
    const { user_metadata } = supabaseUser;
    const firstName = user_metadata?.first_name || user_metadata?.firstName || 'User';
    const lastName = user_metadata?.last_name || user_metadata?.lastName || '';
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      firstName,
      lastName,
      roles: [],  // Roles would come from API
      isActive: supabaseUser.confirmed_at != null,
      twoFactorEnabled: false,  // Would come from API
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
   * Set authentication tokens and schedule refresh
   * @param tokens - Authentication token data
   */
  private setTokens(tokens: AuthTokens): void {
    this.accessToken = tokens.accessToken;
    this.refreshTokenValue = tokens.refreshToken;
    this.tokenExpiresAt = tokens.expiresAt;
    
    // Schedule token refresh at TOKEN_REFRESH_THRESHOLD of token lifetime
    this.scheduleTokenRefresh(tokens.expiresIn);
  }
  
  /**
   * Schedule a token refresh at the appropriate time
   * Refreshes at 75% of token lifetime (22.5 minutes for 30-minute tokens)
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    // Clear any existing timer
    this.clearTokenRefreshTimer();
    
    // Calculate refresh time: TOKEN_REFRESH_THRESHOLD (75%) of expiration time
    const refreshDelay = expiresIn * TOKEN_REFRESH_THRESHOLD * 1000;
    
    // Set up new timer
    this.refreshTimerId = window.setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Scheduled token refresh failed:', error);
        // In a real implementation, we might want to redirect to login
      }
    }, refreshDelay);
  }
  
  /**
   * Clear the token refresh timer
   */
  private clearTokenRefreshTimer(): void {
    if (this.refreshTimerId !== null) {
      window.clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }
}

// Create a singleton instance
const authService = new AuthService();

export default authService;
