/**
 * Authentication types for the application
 * Following the detailed authentication plan with Supabase integration
 * 
 * These types define the structure of authentication-related data throughout the application
 * and are designed to integrate cleanly with Supabase while supporting enterprise features
 * like multi-tenant support, role-based access control, and impersonation.
 */

export interface User {
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
  passwordLastChanged?: Date;
  securityPreferences?: SecurityPreferences;
  // Extensible for future project-specific attributes
  metadata?: Record<string, any>;
}

export interface SecurityPreferences {
  multifactorAuthEnabled: boolean;
  backupCodesGenerated: boolean;
  rememberDevices: boolean;
  notifyOnNewLogin: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  tenantId?: string; // Only present for tenant-specific roles
  isSystemRole: boolean;
  permissions: Permission[];
  isProtected?: boolean; // For roles that cannot be modified/deleted like superadmin
  isSuperadmin?: boolean; // Identifies the superadmin role
}

export interface Permission {
  resource: string;
  action: string;
  tenantId?: string; // For tenant-scoped permissions
}

export interface Tenant {
  id: string;
  name: string;
  domain?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  settings?: TenantSettings;
}

export interface TenantSettings {
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  requireAdminApproval: boolean;
  allowedAuthProviders: string[];
  // Other tenant-specific settings
  [key: string]: any;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // Expiration time in seconds
  expiresAt: number; // Timestamp when the token expires
}

export interface AuthState {
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
  tokens?: AuthTokens;
}

export interface LoginCredentials {
  email: string;
  password: string;
  tenantId?: string;
  rememberMe?: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  switchRole: (roleId: string) => Promise<void>;
  switchTenant: (tenantId: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  hasPermission: (permission: string) => boolean;
  impersonateUser?: (userId: string) => Promise<void>; // Superadmin only
  stopImpersonation?: () => Promise<void>; // When impersonating
}

export interface LoginResponse {
  user: User;
  tenant: Tenant | null;
  tokens: AuthTokens;
  availableRoles: Role[];
  availableTenants: Tenant[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface TenantSwitchResponse {
  tenant: Tenant;
  availableRoles: Role[];
}

export interface RoleSwitchResponse {
  role: Role;
}

export interface InvitationResponse {
  id: string;
  email: string;
  roleId: string;
  tenantId?: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}
