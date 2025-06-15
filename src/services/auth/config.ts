/**
 * Authentication configuration
 * Contains constants and configuration values for the authentication services
 */

// Token refresh threshold: 75% of token lifetime (22.5 minutes for 30-minute tokens)
export const TOKEN_REFRESH_THRESHOLD = 0.75;

// UUID regex pattern for factor ID validation
export const UUID_REGEX = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i;

// Set to false to use real Supabase auth backend
export const USE_MOCK_AUTH = false;

// Mock data for development/testing purposes
export const MOCK_SECRET = 'KREV6SKTONEWCZJZKVMWG2DDMVWWK33O'; // Example TOTP secret
