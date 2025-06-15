# Authentication Implementation

## Overview

This document outlines the authentication implementation in TailAdmin React TypeScript Pro. The authentication system follows the project's architectural rules using React Context for global state management and integrates with Supabase for backend authentication services.

## Architecture

The authentication system consists of the following components:

- **AuthContext**: Provides global authentication state and methods
- **AuthProvider**: Wraps the application and manages auth state transitions
- **useAuth hook**: Custom hook for accessing auth context throughout the app
- **authService**: Service layer that interfaces with Supabase Auth API
- **Auth UI Components**: Login, registration, and password reset forms

## Key Features

- JWT token-based authentication with 30-minute access tokens
- Automatic token refresh using refresh tokens (75% of token lifetime)
- Form validation and error handling
- Support for multi-tenant authentication
- Role-based access control
- Mock mode for development without Supabase credentials

## Implementation Details

### AuthContext and AuthProvider

Located in `/src/context/auth/AuthContext.tsx`, these components:

- Manage global authentication state using useReducer
- Provide login, register, logout, and other auth methods
- Handle user session persistence
- Expose permissions and role information through context

### Authentication Service

Located in `/src/services/authService.ts`, this service:

- Interfaces with Supabase Authentication API
- Manages access and refresh tokens
- Handles token refresh scheduling
- Provides mock mode for development testing

### UI Components

Authentication UI components are located in `/src/components/auth/`:

- **SignInForm.tsx**: Login form with validation and AuthContext integration
- **SignUpForm.tsx**: Registration form with validation and AuthContext integration
- **ResetPasswordForm.tsx**: Password reset functionality

## Environment Setup

The authentication system requires the following environment variables:

```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

For local development without a Supabase project, the system falls back to mock mode by setting `USE_MOCK_AUTH=true` in `authService.ts`.

## Next Steps

1. Set up a real Supabase project for production use
2. Implement two-factor authentication
3. Add user profile management components
4. Enhance role and permission management
5. Implement audit logging for authentication events
