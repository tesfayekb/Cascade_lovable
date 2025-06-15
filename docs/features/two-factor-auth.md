# Two-Factor Authentication

## Overview

Two-factor authentication (2FA) adds an additional layer of security to user accounts beyond just a password. This implementation uses Time-based One-Time Password (TOTP) compatible with standard authenticator apps like Google Authenticator, Authy, and Microsoft Authenticator.

## Architecture

The 2FA implementation is integrated with our existing authentication system and consists of:

1. **Frontend Components:**
   - User interface for enabling/disabling 2FA in the user profile page
   - QR code scanning interface for initial setup
   - Verification code entry interface
   - Recovery codes management

2. **Backend Integration:**
   - 2FA setup, verification, and management via Supabase Auth
   - Storage of user 2FA preferences and status

3. **State Management:**
   - Extended `AuthContext` to include 2FA operations
   - Security preferences management in user profile

## User Flow

1. **Enabling 2FA:**
   - User navigates to their profile security settings
   - User enables 2FA toggle
   - System displays QR code for scanning with authenticator app
   - User enters verification code from authenticator app
   - System verifies code and generates recovery codes
   - 2FA is fully enabled after verification

2. **Login with 2FA:**
   - User enters username/password as usual
   - If 2FA is enabled, system prompts for verification code
   - User enters code from authenticator app
   - Authentication completes after successful verification

3. **Disabling 2FA:**
   - User navigates to profile security settings
   - User disables 2FA toggle (may require password confirmation)
   - System removes 2FA requirement from account

## Components

### UI Components

- `UserSecurityCard.tsx`: Main component for managing security settings including 2FA
- Enhanced `Button.tsx`: Added loading state support for better UX during 2FA operations

### Backend Integration

- `AuthContext.tsx`: Extended to support 2FA operations and security preferences
- Security preferences in user state management

## Security Considerations

- 2FA secrets are never stored in client-side code
- Recovery codes are generated securely and shown only once
- Implementation follows TOTP standards (RFC 6238)
- Proper error handling with generic error messages to prevent information leakage

## Future Improvements

- Add support for multiple 2FA methods (SMS, email)
- Implement device remembering functionality
- Add session management to allow viewing and terminating active sessions
- Enhance recovery options and flows

## Testing

Test the 2FA implementation with these scenarios:

1. Enable 2FA with valid verification code
2. Attempt to enable 2FA with invalid verification code
3. Login with 2FA enabled using correct code
4. Login with 2FA enabled using incorrect code
5. Disable 2FA and confirm it no longer prompts for code
6. Test recovery code functionality

## Configuration

Current implementation includes a development mode that simulates 2FA without requiring a real backend. In production:

1. Set `USE_MOCK_AUTH = false` in `authService.ts`
2. Configure proper Supabase project with MFA settings enabled
3. Set required environment variables for Supabase connection
