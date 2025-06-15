# Backend Architecture

> This architecture document is part of the [Implementation Plan](../implementation-plan.md) and details the backend structure described in Phase 3.

## Overview

This document outlines the backend architecture for the enterprise features, following a frontend-first approach with an embedded backend. The architecture adheres to the Clean Code principles and SOLID design patterns from our global development standards.

## Architectural Approach

We'll implement an embedded backend within the project structure that can later be extracted as a separate service if needed. This approach:

1. **Maintains Project Cohesion**: Keeps frontend and backend code in the same repository
2. **Simplifies Development**: Enables simultaneous work on frontend and backend components
3. **Preserves Future Options**: Designed for potential extraction as microservices
4. **Reduces Integration Complexity**: Shared types between frontend and backend

## Directory Structure

```
/
├── src/                # Frontend application (existing)
│   └── ... (unchanged)
├── server/             # Backend implementation
│   ├── src/
│   │   ├── config/     # Environment and application configuration
│   │   ├── api/        # API route definitions
│   │   ├── controllers/# Request handlers
│   │   ├── services/   # Business logic
│   │   ├── models/     # Data models and database schemas
│   │   ├── middleware/ # Express/NestJS middleware
│   │   └── utils/      # Helper functions and utilities
│   ├── tests/          # Backend tests
│   └── index.ts        # Server entry point
└── shared/             # Shared code between frontend and backend
    └── types/          # Shared TypeScript interfaces
```

## Core Backend Technologies

- **Runtime**: Node.js 20+
- **Framework**: Express.js or NestJS with TypeScript
- **Database**: PostgreSQL with schema-based multi-tenancy
- **Auth Provider**: Supabase Auth for authentication services
- **ORM**: Prisma or TypeORM for database access
- **Authentication**: JWT-based with 30-minute access tokens and refresh token rotation
- **API Documentation**: OpenAPI/Swagger
- **Testing**: Jest for unit and integration tests

## Key Architectural Components

### 1. Multi-Tenant Architecture

The backend will implement a schema-based multi-tenancy approach:

- Each tenant gets their own PostgreSQL schema
- Middleware resolves the current tenant from the request
- Database queries are automatically scoped to the current tenant's schema
- Shared tables for cross-tenant functionality

```typescript
// Example tenant middleware
const tenantMiddleware = async (req, res, next) => {
  const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
  if (!tenantId) {
    return res.status(400).json({ message: 'Tenant ID is required' });
  }
  
  req.tenantId = tenantId;
  // Set the schema for this request
  await setTenantSchema(tenantId);
  next();
};
```

### 2. Authentication System

The backend will integrate with Supabase Auth while implementing additional features:

- JWT-based authentication with 30-minute access token lifetime
- Automatic token refresh at 75% of lifetime (~22 minutes)
- HTTP-only cookies for refresh tokens with sliding expiration
- Careful synchronization between Supabase Auth and database user tables
- Multi-factor authentication (2FA) with TOTP and backup codes
- Rate limiting for authentication attempts
- Comprehensive audit logging with special handling for privileged operations
- Support for user and tenant admin impersonation (superadmin only) with detailed audit trail
- User profile system with extensibility for future project-specific attributes

### 3. Role-Based Access Control

The RBAC system will be implemented with:

- System roles (global, not tenant-specific) including protected superadmin role
- Tenant-specific roles with naming pattern "Admin-{TenantName}"
- Base user role for personal settings management
- Resource-action permission model (`resource:action` at system level)
- Tenant-scoped permission format (`tenant:resource:action`) for tenant permissions
- Database storage of roles and permissions
- Permission checking middleware with efficient caching
- Role hierarchy with inheritance patterns
- Prevention of superadmin role deletion or modification
- Protection for the last superadmin user
- First user auto-assigned as superadmin
- Role-appropriate tenant visibility controls

```typescript
// Example permission middleware with superadmin bypass
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    const { user } = req;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Superadmin bypass with audit logging
    if (await roleService.isSuperAdmin(user.id)) {
      // Log the superadmin access for audit purposes
      await auditService.logSuperAdminAccess(user.id, resource, action, req.tenantId);
      return next();
    }
    
    // For tenant-specific resources
    const permissionKey = req.tenantId 
      ? `${req.tenantId}:${resource}:${action}`
      : `${resource}:${action}`;
    
    const hasPermission = await permissionService.checkPermission(
      user.id,
      permissionKey
    );
    
    if (!hasPermission) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    next();
  };
};
```

### 4. API Layer

The API layer will follow RESTful principles:

- Resource-based routing
- Proper HTTP methods and status codes
- Consistent error handling
- Comprehensive input validation
- Pagination for collection endpoints

### 5. Security Middleware

Security will be implemented through middleware:

- CORS configuration
- CSRF protection
- Rate limiting
- Request validation
- Content security policies

## Data Models

### Core Entity Relationships

The following diagram shows the relationships between core data models:

```
Tenant 1:N User
User N:M Role
Role N:M Permission
Permission N:1 Resource
Tenant 1:N Invitation
Invitation N:1 Role
User 1:N AuditLogEntry
```

### Key Models

- **Tenant**: Organization or account with its own data space
- **User**: Individual with authentication credentials and extensible profile
  - Core identity fields (name, email, etc.)
  - Security metadata (registration date, last login, etc.)
  - Extensible metadata field (JSON) for future project attributes
- **Role**: Named set of permissions assigned to users
- **Permission**: Authorization to perform an action on a resource
- **Resource**: Entity or system feature that can be accessed
- **Invitation**: System for inviting users with pre-assigned roles
  - System-level invitations
  - Tenant-level invitations
  - Role pre-assignment
  - Expiration handling
- **Audit Log**: Comprehensive tracking of security events
  - Authentication events
  - Permission checks
  - Impersonation activities
  - Superadmin actions

## API Design Principles

1. **Consistent Naming**: RESTful resource naming conventions
2. **Proper Status Codes**: Appropriate HTTP status for all responses
3. **Comprehensive Documentation**: Complete OpenAPI documentation
4. **Versioning Strategy**: URL-based API versioning
5. **Error Handling**: Consistent error response format

## Error Handling Strategy

Backend error handling follows these principles:

1. **Layer-Appropriate Handling**: Catch errors at the right level
2. **Meaningful Error Messages**: Clear but secure error descriptions
3. **Error Categories**: Group errors by type for consistent handling
4. **Security Awareness**: Never leak sensitive information
5. **Comprehensive Logging**: Log all errors with appropriate detail

## Testing Strategy

Testing will ensure reliability and security:

1. **Unit Testing**: Test individual functions and services
2. **Integration Testing**: Test API endpoints and database interactions
3. **Security Testing**: Verify authentication and authorization
4. **Multi-tenant Testing**: Ensure proper tenant isolation
5. **Performance Testing**: Verify scalability and response times

## Development Workflow

The backend development workflow will:

1. Start with database schema design
2. Implement core authentication and RBAC
   - Supabase Auth integration
   - Role and permission models
   - Invitation system
   - User profile extensibility
3. Build API endpoints with proper validation
4. Add comprehensive test coverage
   - Authentication flow tests
   - Permission boundary tests
   - Invitation workflow tests
5. Document API with OpenAPI/Swagger

## Future Considerations

The backend architecture is designed for future extensibility:

1. **Microservice Extraction**: Path to extracting services
2. **Horizontal Scaling**: Design for independent scaling
3. **Cache Integration**: Redis for performance optimization
4. **Message Queues**: Background processing with queues
5. **Observability**: Integration with monitoring tools

## Compliance with Development Standards

This backend architecture adheres to our global development standards:

1. **Clean Code Principles**: Clear, maintainable code structure
2. **SOLID Design Principles**: Single responsibility, dependency inversion
3. **Security Best Practices**: Input validation, secure authentication
4. **Performance Considerations**: Efficient database access, caching strategy
5. **Documentation**: Comprehensive code and API documentation
