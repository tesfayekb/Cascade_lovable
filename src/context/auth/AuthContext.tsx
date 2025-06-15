/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 * Implements the specifications from the authentication detailed plan
 */

// External imports
import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';

// Internal imports
import authService from '../../services/authService';
import { 
  AuthContextType, 
  AuthState, 
  LoginCredentials, 
  RegisterData,
  SecurityPreferences,
  User
} from '../../types/auth';

// Initial authentication state
const initialState: AuthState = {
  user: null,
  tenant: null,
  currentRole: null,
  availableRoles: [],
  availableTenants: [],
  isAuthenticated: false,
  isLoading: true,
  isImpersonating: false,
  isSuperadmin: false
};

// Action types for reducer
type AuthAction = 
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: Omit<AuthState, 'isLoading'> }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SWITCH_ROLE'; payload: { currentRole: AuthState['currentRole'] } }
  | { type: 'SWITCH_TENANT'; payload: { tenant: AuthState['tenant']; availableRoles: AuthState['availableRoles'] } }
  | { type: 'UPDATE_USER'; payload: { user: User } }
  | { type: 'UPDATE_SECURITY_PREFERENCES'; payload: { securityPreferences: Partial<User['securityPreferences']> } }
  | { type: 'START_IMPERSONATION'; payload: { originalUser: User; user: User; tenant: AuthState['tenant']; currentRole: AuthState['currentRole']; availableRoles: AuthState['availableRoles'] } }
  | { type: 'STOP_IMPERSONATION'; payload: { user: User; tenant: AuthState['tenant']; currentRole: AuthState['currentRole']; availableRoles: AuthState['availableRoles'] } }
  | { type: 'SET_LOADING'; payload: boolean };

// Reducer function to handle state changes
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true };
      
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        isLoading: false,
        // Determine if user is superadmin based on roles
        isSuperadmin: action.payload.availableRoles.some(role => role.isSuperadmin)
      };
      
    case 'LOGIN_FAILURE':
      return {
        ...initialState,
        isLoading: false
      };
      
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false
      };
      
    case 'SWITCH_ROLE':
      return {
        ...state,
        currentRole: action.payload.currentRole
      };
      
    case 'SWITCH_TENANT':
      return {
        ...state,
        tenant: action.payload.tenant,
        availableRoles: action.payload.availableRoles,
        // Reset current role when switching tenants
        currentRole: null
      };
      
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload.user
      };
      
    case 'UPDATE_SECURITY_PREFERENCES':
      if (!state.user) return state;
      
      return {
        ...state,
        user: {
          ...state.user,
          securityPreferences: {
            ...(state.user.securityPreferences || {
              multifactorAuthEnabled: false,
              backupCodesGenerated: false,
              rememberDevices: false,
              notifyOnNewLogin: false
            }),
            ...action.payload.securityPreferences
          }
        }
      };
      
    case 'START_IMPERSONATION':
      return {
        ...state,
        isImpersonating: true,
        originalUser: action.payload.originalUser,
        user: action.payload.user,
        tenant: action.payload.tenant,
        currentRole: action.payload.currentRole,
        availableRoles: action.payload.availableRoles,
        // Superadmin status is based on the original user, not the impersonated one
        isSuperadmin: false
      };
      
    case 'STOP_IMPERSONATION':
      return {
        ...state,
        isImpersonating: false,
        originalUser: undefined,
        user: action.payload.user,
        tenant: action.payload.tenant,
        currentRole: action.payload.currentRole,
        availableRoles: action.payload.availableRoles,
        // Restore superadmin status from original user's roles
        isSuperadmin: action.payload.availableRoles.some(role => role.isSuperadmin)
      };
      
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };
      
    default:
      return state;
  }
};

// Create the auth context
// Create the context with undefined default value
// It will be populated by the AuthProvider
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * AuthProvider component
 * Provides authentication state and methods to all children
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }): React.ReactElement => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  
  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // In the future, we would check for an existing session here
        // For now, we'll just set loading to false
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Error checking authentication:', error);
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };
    
    checkAuth();
  }, []);
  
  /**
   * Login with email and password
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const response = await authService.login(credentials);
      
      // Determine the default role (first available role)
      const defaultRole = response.availableRoles.length > 0 ? response.availableRoles[0] : null;
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          tenant: response.tenant,
          currentRole: defaultRole,
          availableRoles: response.availableRoles,
          availableTenants: response.availableTenants,
          isAuthenticated: true,
          isImpersonating: false,
          isSuperadmin: response.availableRoles.some(role => role.isSuperadmin)
        }
      });
    } catch (error) {
      console.error('Login failed:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  }, []);
  
  /**
   * Register a new user with email and password
   */
  const register = useCallback(async (data: RegisterData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Call the register method from authService
      await authService.register(data);
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Registration failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  }, []);

  /**
   * Log out the current user
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }, []);
  
  /**
   * Switch to a different role
   */
  const switchRole = useCallback(async (roleId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authService.switchRole(roleId);
      
      dispatch({
        type: 'SWITCH_ROLE',
        payload: {
          currentRole: response.role
        }
      });
      
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Role switch failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  }, []);
  
  /**
   * Switch to a different tenant
   */
  const switchTenant = useCallback(async (tenantId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authService.switchTenant(tenantId);
      
      dispatch({
        type: 'SWITCH_TENANT',
        payload: {
          tenant: response.tenant,
          availableRoles: response.availableRoles
        }
      });
      
      dispatch({ type: 'SET_LOADING', payload: false });
      
      // Automatically switch to the first available role in the new tenant
      if (response.availableRoles.length > 0) {
        await switchRole(response.availableRoles[0].id);
      }
    } catch (error) {
      console.error('Tenant switch failed:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  }, [switchRole]);
  
  /**
   * Request a password reset
   */
  const resetPassword = useCallback(async (email: string) => {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      console.error('Password reset failed:', error);
      throw error;
    }
  }, []);
  
  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (userData: Partial<User>) => {
    try {
      if (!state.user) {
        throw new Error('No user is logged in');
      }
      
      await authService.updateProfile(userData);
      
      // Update local state
      dispatch({
        type: 'UPDATE_USER',
        payload: {
          user: {
            ...state.user,
            ...userData
          }
        }
      });
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }, [state.user]);
  
  /**
   * Check if user has a specific permission
   */
  const hasPermission = useCallback((permission: string) => {
    // Early return if no current role or user is not authenticated
    if (!state.currentRole || !state.isAuthenticated) {
      return false;
    }
    
    // Superadmin has all permissions (with audit logging handled in backend)
    if (state.isSuperadmin) {
      return true;
    }
    
    // Parse the permission string to extract resource and action
    // Format: either 'resource:action' or 'tenant:resource:action'
    const parts = permission.split(':');
    
    // For tenant-scoped permissions (tenant:resource:action)
    if (parts.length === 3) {
      const [tenantId, resource, action] = parts;
      
      // Check if permission is for the current tenant
      if (state.tenant?.id !== tenantId) {
        return false;
      }
      
      // Check if the current role has this permission
      return state.currentRole.permissions.some(
        p => p.resource === resource && p.action === action && p.tenantId === tenantId
      );
    }
    
    // For system-level permissions (resource:action)
    if (parts.length === 2) {
      const [resource, action] = parts;
      
      // Check if the current role has this permission
      return state.currentRole.permissions.some(
        p => p.resource === resource && p.action === action && !p.tenantId
      );
    }
    
    // Invalid permission format
    console.error(`Invalid permission format: ${permission}`);
    return false;
  }, [state.currentRole, state.isAuthenticated, state.isSuperadmin, state.tenant?.id]);
  
  /**
   * Impersonate another user (superadmin only)
   */
  const impersonateUser = useCallback(async (userId: string) => {
    try {
      // Only superadmins can impersonate
      if (!state.isSuperadmin) {
        throw new Error('Only superadmins can impersonate users');
      }
      
      const response = await authService.impersonateUser(userId);
      
      // Store the original user information
      const originalUser = state.user;
      
      if (!originalUser) {
        throw new Error('No current user to store for impersonation');
      }
      
      // Determine the default role (first available role)
      const defaultRole = response.availableRoles.length > 0 ? response.availableRoles[0] : null;
      
      dispatch({
        type: 'START_IMPERSONATION',
        payload: {
          originalUser,
          user: response.user,
          tenant: response.tenant,
          currentRole: defaultRole,
          availableRoles: response.availableRoles
        }
      });
    } catch (error) {
      console.error('User impersonation failed:', error);
      throw error;
    }
  }, [state.user, state.isSuperadmin]);
  
  /**
   * Stop impersonating another user
   */
  const stopImpersonation = useCallback(async () => {
    try {
      // Can only stop impersonation if currently impersonating
      if (!state.isImpersonating || !state.originalUser) {
        throw new Error('Not currently impersonating');
      }
      
      await authService.stopImpersonation();
      
      // Restore the original user state
      dispatch({
        type: 'STOP_IMPERSONATION',
        payload: {
          user: state.originalUser,
          tenant: state.tenant, // Maintain current tenant
          currentRole: state.currentRole, // Maintain current role
          availableRoles: state.availableRoles // Maintain available roles
        }
      });
    } catch (error) {
      console.error('Stop impersonation failed:', error);
      throw error;
    }
  }, [state.isImpersonating, state.originalUser, state.tenant, state.currentRole, state.availableRoles]);

  /**
   * Update user's security preferences
   */
  const updateSecurityPreferences = useCallback(async (securityPreferences: Partial<SecurityPreferences>) => {
  try {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    // In a real implementation, we would call authService to update security preferences
    // await authService.updateSecurityPreferences(securityPreferences);
    
    // For now, just update the state directly
    dispatch({ 
      type: 'UPDATE_SECURITY_PREFERENCES', 
      payload: { securityPreferences }
    });
    
    dispatch({ type: 'SET_LOADING', payload: false });
    return Promise.resolve();
  } catch (error) {
    console.error('Failed to update security preferences:', error);
    dispatch({ type: 'SET_LOADING', payload: false });
    return Promise.reject(error);
  }
}, []);

// Create the context value with memoization to prevent unnecessary re-renders
const contextValue = useMemo(
  () => ({
    // State
    user: state.user,
    tenant: state.tenant,
    currentRole: state.currentRole,
    availableRoles: state.availableRoles,
    availableTenants: state.availableTenants,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isImpersonating: state.isImpersonating,
    isSuperadmin: state.isSuperadmin,
    
    // Authentication methods
    login,
    register,
    logout,
    switchRole,
    switchTenant,
    resetPassword,
    updateProfile,
    updateSecurityPreferences,
    hasPermission,
    impersonateUser,
    stopImpersonation,
  }),
  [
    state,
    login,
    register,
    logout,
    switchRole,
    switchTenant,
    resetPassword,
    updateProfile,
    updateSecurityPreferences,
    hasPermission,
    impersonateUser,
    stopImpersonation
  ]
);

return (
  <AuthContext.Provider value={contextValue}>
    {children}
  </AuthContext.Provider>
);
};

/**
 * Custom hook to use the auth context
 * Ensures the hook is used within an AuthProvider
 * 
 * @returns Auth context with user state and authentication methods
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
