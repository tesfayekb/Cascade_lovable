/**
 * Token Management Service
 * Handles authentication token operations, refresh scheduling, and token storage
 */

import { AuthTokens } from '../../types/auth';
import { TOKEN_REFRESH_THRESHOLD } from './config';
import { SupabaseClient } from '@supabase/supabase-js';
// No need to import supabase here as it's passed via constructor

export class TokenService {
  private supabaseClient: SupabaseClient;
  
  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient;
  }
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private refreshTimerId: number | null = null;

  /**
   * Get the current access token
   * @returns Current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Set authentication tokens and schedule refresh
   * @param tokens - Authentication token data
   */
  setTokens(tokens: AuthTokens): void {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    // Store expiry information in the refresh timer only
    
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
        await this.refreshTokens();
      } catch (error) {
        console.error('Scheduled token refresh failed:', error);
        // In a real implementation, we might want to redirect to login
      }
    }, refreshDelay);
  }
  
  /**
   * Clear the token refresh timer
   */
  clearTokenRefreshTimer(): void {
    if (this.refreshTimerId !== null) {
      window.clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }
  
  /**
   * Refresh the access token using the refresh token
   * @returns New token data
   */
  async refreshTokens(): Promise<AuthTokens> {
    try {
      if (!this.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // Use Supabase auth to refresh the session
      const { data, error } = await this.supabaseClient.auth.refreshSession();
      
      if (error || !data?.session) {
        throw new Error(error?.message || 'Failed to refresh token');
      }
      
      const expiresIn = data.session.expires_in || 1800; // Default 30 minutes
      const expiresAt = Date.now() + expiresIn * 1000;
      
      // Create token response
      const tokens: AuthTokens = {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresIn,
        expiresAt
      };
      
      // Update tokens and schedule next refresh
      this.setTokens(tokens);
      
      return tokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }
}
