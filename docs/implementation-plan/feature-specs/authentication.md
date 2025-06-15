# Authentication System Specification

> This specification is part of the [Implementation Plan](../implementation-plan.md) and details the authentication feature described in Phase 1.

## Overview

The authentication system will provide secure, multi-tenant user authentication while maintaining the existing UI components and application structure. This specification follows the Clean Code principles and SOLID design patterns as outlined in our global development standards.

This system supports both system-level roles (like superadmin) and tenant-specific roles with appropriate permission scoping and user interface elements for role/tenant switching.

## Requirements

### Functional Requirements

1. **User Authentication**
   - Email/password authentication
   - Two-factor authentication support
   - "Remember me" functionality
   - Password reset flow
   - Account lockout after failed attempts

2. **Session Management**
   - JWT-based authentication
   - Secure token storage
   - Token refresh mechanism
   - Automatic session timeout
   - Multi-device session tracking

3. **User Registration**
   - Self-registration (configurable per tenant)
   - Email verification through Supabase's built-in features
   - Terms acceptance tracking
   - Invitation-based registration with:
     - System-level invitations
     - Tenant-level invitations
     - Role pre-assignment in invitations
     - Invitation expiration settings
     - Bulk invitation tools
   - Registration approval workflows

4. **Profile Management**
   - View/edit profile information
   - Change password functionality
   - Manage 2FA settings
   - View login history
   - Manage personal preferences
   - Extensibility mechanism for future project-specific attributes

5. **Role & Tenant Management**
   - System-level roles (not tenant-specific) and tenant-specific roles following naming pattern "Admin-{TenantName}"
   - Role switching interface (positioned below logo/above menu)
   - Role-appropriate tenant visibility (superadmin sees all, users only see assigned tenants)
   - Tenant switching capabilities with clear UI indicators
   - Superadmin impersonation features (can act as any user or tenant admin)
   - Protection against superadmin role deletion or modification
   - First user auto-assigned as superadmin
   - Prevention of deleting last superadmin user
   - Permission grouping by resource for efficient management

### Security Requirements

1. **Credential Security**
   - Password hashing with bcrypt/Argon2
   - HTTPS-only cookie storage
   - CSRF protection
   - Rate limiting for login attempts
   - Secure password reset tokens
   - Synchronization between Supabase Auth and database user tables

2. **Authentication Flow Security**
   - JWTs with 30-minute expiration
   - Automatic token refresh at 75% of lifetime (~22 minutes)
   - Access tokens in memory, refresh tokens in HTTP-only cookies
   - XSS prevention measures
   - Proper error handling without information leakage
   - Comprehensive audit logging of authentication events
   - Special logging for superadmin actions

## Technical Design

### Frontend Components

```
src/
├── components/
│   └── auth/
│       ├── LoginForm.tsx              # Enhanced login form
│       ├── SignupForm.tsx             # Enhanced signup with tenant context
│       ├── TwoFactorAuth.tsx          # 2FA verification component
│       ├── PasswordResetForm.tsx      # Password reset workflow
│       ├── ProfileSettings.tsx        # User profile settings
│       ├── SecuritySettings.tsx       # Security preferences management
│       ├── RoleSwitcher.tsx          # Role switching dropdown (below logo)
│       └── TenantSwitcher.tsx        # Tenant selection component
├── context/
│   ├── AuthContext.tsx               # Authentication state management
│   └── TenantContext.tsx             # Tenant context management
├── hooks/
│   ├── useAuth.tsx                   # Authentication state and methods
│   ├── useAuthProtection.tsx         # Route protection hook
│   └── usePermission.tsx             # Permission checking hook
```

### State Management

Authentication state will be managed through React Context:

```tsx
// AuthContext.tsx (simplified example)
interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  currentRole: Role | null;
  availableRoles: Role[];
  availableTenants: Tenant[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isImpersonating: boolean;
  isSuperadmin: boolean;
  originalUser?: User; // When impersonating
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchRole: (roleId: string) => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  impersonateUser?: (userId: string) => Promise<void>; // Superadmin only
  stopImpersonation?: () => Promise<void>; // When impersonating
}

// Usage in components via hook:
const { user, isAuthenticated, login, logout } = useAuth();
```

### API Integration

Authentication API endpoints will be defined in service interfaces:

```tsx
// src/api/auth.ts
export const authService = {
  login: (email: string, password: string, tenantId?: string): Promise<LoginResponse> => {
    return apiClient.post('/auth/login', { email, password, tenantId });
  },
  
  refreshToken: (): Promise<TokenResponse> => {
    return apiClient.post('/auth/refresh');
  },
  
  // Tenant and role management
  switchTenant: (tenantId: string): Promise<TenantSwitchResponse> => {
    return apiClient.post('/auth/switch-tenant', { tenantId });
  },
  
  switchRole: (roleId: string): Promise<RoleSwitchResponse> => {
    return apiClient.post('/auth/switch-role', { roleId });
  },
  
  // Impersonation features (superadmin only)
  impersonateUser: (userId: string): Promise<LoginResponse> => {
    return apiClient.post('/auth/impersonate', { userId });
  },
  
  stopImpersonation: (): Promise<LoginResponse> => {
    return apiClient.post('/auth/stop-impersonation');
  },
  
  // Invitation system
  createInvitation: (email: string, roleId: string, tenantId?: string): Promise<InvitationResponse> => {
    return apiClient.post('/auth/invitations', { email, roleId, tenantId });
  },
  
  // Additional authentication methods
};
```

### Backend Implementation (Phase 3)

```
server/
├── src/
│   ├── controllers/
│   │   └── auth.controller.ts       # Authentication endpoints
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT verification
│   │   └── tenant.middleware.ts     # Tenant context extraction
│   ├── services/
│   │   └── auth.service.ts          # Authentication business logic
│   └── models/
│       ├── user.model.ts            # User data model
│       └── tenant.model.ts          # Tenant data model
```

## Data Models

### User

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
  registrationDate: Date;
  failedLoginAttempts: number;
  lastFailedLogin: Date | null;
  // Security metadata
  passwordLastChanged?: Date;
  securityPreferences?: SecurityPreferences;
  // Extensible for future project-specific attributes
  metadata?: Record<string, any>;
}

interface SecurityPreferences {
  multifactorAuthEnabled: boolean;
  backupCodesGenerated: boolean;
  rememberDevices: boolean;
  notifyOnNewLogin: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  tenantId?: string; // Only present for tenant-specific roles
  isSystemRole: boolean;
  permissions: Permission[];
  isProtected?: boolean; // For roles that cannot be modified/deleted like superadmin
  isSuperadmin?: boolean; // Identifies the superadmin role
}

interface Permission {
  resource: string;
  action: string;
  tenantId?: string; // For tenant-scoped permissions
  // Follows format of resource:action at system level
  // or tenant:resource:action for tenant-scoped permissions
  // Based on Filament Shield model with standard CRUD actions
  // plus extended actions for custom operations
}
```

### Authentication Tokens

```typescript
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

## Integration with Existing UI

The authentication system will enhance the existing Sign In and Sign Up pages while maintaining their current design and user experience:

1. **SignIn.tsx**: Add 2FA support and "remember me" functionality 
2. **SignUp.tsx**: Add email verification integration with Supabase
3. **AppLayout.tsx**: 
   - Integrate authentication state for protected routes
   - Add role/tenant switcher component below logo/above menu in sidebar
   - Add impersonation indicators when acting as another user (superadmin)
4. **UserTable.tsx**: Add impersonation links for superadmin

## Security Considerations

1. **Token Storage**: Access tokens stored in memory, refresh tokens in HTTP-only cookies
2. **Token Lifecycle**: 30-minute access token lifetime with automatic refresh at ~22 minutes, sliding expiration for refresh tokens
3. **Password Security**: Strong password policies and secure hashing with bcrypt/Argon2
4. **Error Handling**: Generic error messages to prevent information disclosure
5. **HTTPS Enforcement**: All authentication traffic over HTTPS
6. **Audit Logging**: Comprehensive logging of authentication events, permission checks, and impersonation activities
7. **Supabase Integration**: Careful synchronization between Auth and database tables
8. **Superadmin Actions**: Special handling and audit logging of privileged operations including bypass of permission checks
9. **Permission Caching**: Efficient caching of permission checks for performance optimization
10. **Account Protection**: Account lockout after failed attempts, secure token invalidation on security events

## Testing Strategy

### Unit Tests

- Test authentication hooks and context providers
- Verify form validation logic
- Test protected route components

### Integration Tests

- Test complete authentication flows
- Verify token refresh mechanism
- Test error handling scenarios

### Security Tests

- Attempt common authentication attacks
- Verify CSRF protection
- Test rate limiting functionality

## Implementation Phases

### Phase 1: Frontend Components and State

- Build enhanced login/signup forms
- Create AuthContext for state management
- Implement auth protection hooks
- Add profile management UI

### Phase 2: API Integration

- Create auth service interfaces
- Implement token management
- Add mock responses for development

### Phase 3: Backend Implementation

- Build authentication controllers and services
- Implement JWT generation and validation
- Create secure password handling

## Compliance with Development Standards

This authentication system implementation adheres to our global development standards:

1. **Clean Code Principles**: Readable, maintainable code with clear naming
2. **SOLID Design Principles**: Single responsibility and interface segregation 
3. **Security Best Practices**: Input validation, secure cryptography, proper error handling
4. **Performance Considerations**: Efficient token validation and state management
5. **Comprehensive Documentation**: Clear documentation of authentication flows
