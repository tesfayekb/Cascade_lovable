# Authentication System Implementation

This directory contains the authentication system implementation following the detailed plan outlined in the project documentation. The implementation provides a secure, multi-tenant authentication system with role-based access control and integration with Supabase Auth.

## Core Components

### AuthContext

The `AuthContext` provides global authentication state and methods throughout the application, including:

- User identity and profile management
- Multi-tenant support with tenant context
- Role-based access control (RBAC)
- Permission checking with resource:action format
- Token lifecycle management (30-minute access tokens with auto-refresh at 75% lifetime)
- Impersonation capabilities for superadmins and tenant admins

### Token Management

- Access tokens expire after 30 minutes
- Automatic token refresh at 75% of lifetime (~22.5 minutes)
- Tokens are stored securely and never exposed in code

### Features Implemented

- [x] `AuthContext` for global auth state with Supabase integration
- [x] JWT token handling with 30-minute access tokens and auto-refresh
- [x] Login/logout functionality
- [x] Role and tenant switching
- [x] Permission checking (`hasPermission` method)
- [x] Impersonation (for superadmins)
- [x] Profile updating

### Features Pending Implementation

- [ ] Enhanced login/signup forms with UI components
- [ ] Two-factor authentication UI
- [ ] User profile management components
- [ ] User listing and administrative UI with visual impersonation indicators
- [ ] Comprehensive audit logging
- [ ] Role and tenant switcher UI components
- [ ] Invitation system UI

## Security Considerations

- Password hashing using bcrypt/Argon2 (handled by Supabase)
- CSRF and XSS protections
- HTTP-only cookies for refresh tokens
- In-memory storage for access tokens
- Audit logging for security events

## Usage Examples

```typescript
import { useAuth } from '../../context/auth/AuthContext';

const MyComponent = () => {
  const { 
    user, 
    isAuthenticated, 
    login, 
    logout, 
    hasPermission,
    switchRole,
    switchTenant 
  } = useAuth();

  // Check permissions
  const canEditUsers = hasPermission('users:edit');
  
  // Example of tenant-scoped permission
  const canEditTenantUsers = hasPermission('tenant-123:users:edit');

  return (
    // Component implementation
  );
};
```

## Next Steps

1. Create UI components for login, signup, and two-factor authentication
2. Implement `TenantContext` for tenant state management
3. Create role and tenant switcher UI components
4. Implement comprehensive audit logging
5. Connect to actual backend APIs for user/role/tenant management
