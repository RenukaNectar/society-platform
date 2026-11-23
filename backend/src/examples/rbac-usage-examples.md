# RBAC Middleware Usage Examples

This document provides comprehensive examples of how to use the new Role-Based Access Control (RBAC) middleware system in your routes.

## Overview

The RBAC system is based on the permissions table provided, where each role has specific permissions for different resources and actions:

- **Admin**: Full access to all features
- **Registrar**: Approve, Reject, Apply Hearing for most features
- **Joint Registrar**: Approve, Reject for most features
- **Senior Inspector**: Approve, Reject for most features
- **Deputy Registrar**: Approve, Reject for most features
- **Dealing Assistant**: View only for most features
- **Field Inspector**: View only for most features
- **Applicant**: Create, Edit, View for society-related features only

## Basic Permission Middleware

### Single Permission Check

```typescript
import { canViewUsers } from '../../middleware/rbac';

// Only users with 'view' permission on 'user' resource can access
router.get('/users', authenticateToken, canViewUsers(), getUsers);
```

### Multiple Permission Check (Any)

```typescript
import { requireAnyPermission } from '../../middleware/rbac';

// User needs any one of these permissions
router.post('/users', authenticateToken, 
  requireAnyPermission([
    { resource: 'user', action: 'create' },
    { resource: 'user', action: 'edit' }
  ]), 
  createUser
);
```

### Multiple Permission Check (All)

```typescript
import { requireAllPermissions } from '../../middleware/rbac';

// User needs all of these permissions
router.put('/users/:id', authenticateToken, 
  requireAllPermissions([
    { resource: 'user', action: 'view' },
    { resource: 'user', action: 'edit' }
  ]), 
  updateUser
);
```

## Resource-Specific Permission Middleware

### User Management

```typescript
import { 
  canViewUsers, 
  canManageUsers, 
  canEditUsers, 
  canDeleteUsers 
} from '../../middleware/rbac';

// View users
router.get('/users', authenticateToken, canViewUsers(), getUsers);

// Create user (Admin only)
router.post('/users', authenticateToken, canManageUsers(), createUser);

// Edit user (Admin only)
router.put('/users/:id', authenticateToken, canEditUsers(), updateUser);

// Delete user (Admin only)
router.delete('/users/:id', authenticateToken, canDeleteUsers(), deleteUser);
```

### Society Management

```typescript
import { 
  canViewSocieties, 
  canManageSocieties, 
  canEditSocieties, 
  canDeleteSocieties,
  canApproveSocieties,
  canRejectSocieties
} from '../../middleware/rbac';

// View societies
router.get('/societies', authenticateToken, canViewSocieties(), getSocieties);

// Create society (Applicant, Admin)
router.post('/societies', authenticateToken, canManageSocieties(), createSociety);

// Edit society (Applicant, Admin)
router.put('/societies/:id', authenticateToken, canEditSocieties(), updateSociety);

// Approve society (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/societies/:id/approve', authenticateToken, canApproveSocieties(), approveSociety);

// Reject society (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/societies/:id/reject', authenticateToken, canRejectSocieties(), rejectSociety);
```

### Registration Management

```typescript
import { 
  canViewRegistrations, 
  canManageRegistrations, 
  canEditRegistrations, 
  canDeleteRegistrations,
  canApproveRegistrations,
  canRejectRegistrations
} from '../../middleware/rbac';

// View registrations
router.get('/registrations', authenticateToken, canViewRegistrations(), getRegistrations);

// Create registration (Applicant, Admin)
router.post('/registrations', authenticateToken, canManageRegistrations(), createRegistration);

// Edit registration (Applicant, Admin)
router.put('/registrations/:id', authenticateToken, canEditRegistrations(), updateRegistration);

// Approve registration (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/registrations/:id/approve', authenticateToken, canApproveRegistrations(), approveRegistration);

// Reject registration (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/registrations/:id/reject', authenticateToken, canRejectRegistrations(), rejectRegistration);
```

### Annual Returns

```typescript
import { 
  canViewAnnualReturns, 
  canManageAnnualReturns, 
  canEditAnnualReturns, 
  canDeleteAnnualReturns,
  canApproveAnnualReturns,
  canRejectAnnualReturns
} from '../../middleware/rbac';

// View annual returns
router.get('/annual-returns', authenticateToken, canViewAnnualReturns(), getAnnualReturns);

// Create annual return (Applicant, Admin)
router.post('/annual-returns', authenticateToken, canManageAnnualReturns(), createAnnualReturn);

// Edit annual return (Applicant, Admin)
router.put('/annual-returns/:id', authenticateToken, canEditAnnualReturns(), updateAnnualReturn);

// Approve annual return (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/annual-returns/:id/approve', authenticateToken, canApproveAnnualReturns(), approveAnnualReturn);

// Reject annual return (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/annual-returns/:id/reject', authenticateToken, canRejectAnnualReturns(), rejectAnnualReturn);
```

### Amendments

```typescript
import { 
  canViewAmendments, 
  canManageAmendments, 
  canEditAmendments, 
  canDeleteAmendments,
  canApproveAmendments,
  canRejectAmendments
} from '../../middleware/rbac';

// View amendments
router.get('/amendments', authenticateToken, canViewAmendments(), getAmendments);

// Create amendment (Applicant, Admin)
router.post('/amendments', authenticateToken, canManageAmendments(), createAmendment);

// Edit amendment (Applicant, Admin)
router.put('/amendments/:id', authenticateToken, canEditAmendments(), updateAmendment);

// Approve amendment (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/amendments/:id/approve', authenticateToken, canApproveAmendments(), approveAmendment);

// Reject amendment (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/amendments/:id/reject', authenticateToken, canRejectAmendments(), rejectAmendment);
```

### Election Requests

```typescript
import { 
  canViewElectionRequests, 
  canManageElectionRequests, 
  canEditElectionRequests, 
  canDeleteElectionRequests,
  canApproveElectionRequests,
  canRejectElectionRequests
} from '../../middleware/rbac';

// View election requests
router.get('/election-requests', authenticateToken, canViewElectionRequests(), getElectionRequests);

// Create election request (Applicant, Admin)
router.post('/election-requests', authenticateToken, canManageElectionRequests(), createElectionRequest);

// Edit election request (Applicant, Admin)
router.put('/election-requests/:id', authenticateToken, canEditElectionRequests(), updateElectionRequest);

// Approve election request (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/election-requests/:id/approve', authenticateToken, canApproveElectionRequests(), approveElectionRequest);

// Reject election request (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/election-requests/:id/reject', authenticateToken, canRejectElectionRequests(), rejectElectionRequest);
```

### Audit Requests

```typescript
import { 
  canViewAuditRequests, 
  canManageAuditRequests, 
  canEditAuditRequests, 
  canDeleteAuditRequests,
  canApproveAuditRequests,
  canRejectAuditRequests
} from '../../middleware/rbac';

// View audit requests
router.get('/audit-requests', authenticateToken, canViewAuditRequests(), getAuditRequests);

// Create audit request (Applicant, Admin)
router.post('/audit-requests', authenticateToken, canManageAuditRequests(), createAuditRequest);

// Edit audit request (Applicant, Admin)
router.put('/audit-requests/:id', authenticateToken, canEditAuditRequests(), updateAuditRequest);

// Approve audit request (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/audit-requests/:id/approve', authenticateToken, canApproveAuditRequests(), approveAuditRequest);

// Reject audit request (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/audit-requests/:id/reject', authenticateToken, canRejectAuditRequests(), rejectAuditRequest);
```

### Liquidations

```typescript
import { 
  canViewLiquidations, 
  canManageLiquidations, 
  canEditLiquidations, 
  canDeleteLiquidations,
  canApproveLiquidations,
  canRejectLiquidations
} from '../../middleware/rbac';

// View liquidations
router.get('/liquidations', authenticateToken, canViewLiquidations(), getLiquidations);

// Create liquidation (Applicant, Admin)
router.post('/liquidations', authenticateToken, canManageLiquidations(), createLiquidation);

// Edit liquidation (Applicant, Admin)
router.put('/liquidations/:id', authenticateToken, canEditLiquidations(), updateLiquidation);

// Approve liquidation (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/liquidations/:id/approve', authenticateToken, canApproveLiquidations(), approveLiquidation);

// Reject liquidation (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar, Admin)
router.post('/liquidations/:id/reject', authenticateToken, canRejectLiquidations(), rejectLiquidation);
```

## Role-Based Middleware

### Admin Only

```typescript
import { requireAdminRole } from '../../middleware/rbac';

// Only admin users can access
router.get('/admin/dashboard', authenticateToken, requireAdminRole(), getAdminDashboard);
router.post('/admin/settings', authenticateToken, requireAdminRole(), updateSettings);
```

### Registrar Role

```typescript
import { requireRegistrarRole } from '../../middleware/rbac';

// Only registrar users can access
router.post('/hearings/apply', authenticateToken, requireRegistrarRole(), applyHearing);
router.post('/hearings/resolve', authenticateToken, requireRegistrarRole(), resolveHearing);
```

### Approver Roles

```typescript
import { requireApproverRole } from '../../middleware/rbac';

// Users with approve/reject permissions (Registrar, Joint Registrar, Senior Inspector, Deputy Registrar)
router.post('/registrations/:id/approve', authenticateToken, requireApproverRole(), approveRegistration);
router.post('/registrations/:id/reject', authenticateToken, requireApproverRole(), rejectRegistration);
```

### Viewer Roles

```typescript
import { requireViewerRole } from '../../middleware/rbac';

// Users with view permissions (all roles except Applicant)
router.get('/dashboard', authenticateToken, requireViewerRole(), getDashboard);
router.get('/reports', authenticateToken, requireViewerRole(), getReports);
```

### Applicant Role

```typescript
import { requireApplicantRole } from '../../middleware/rbac';

// Only applicant users can access
router.get('/my-applications', authenticateToken, requireApplicantRole(), getMyApplications);
router.post('/my-applications', authenticateToken, requireApplicantRole(), createApplication);
```

## Dashboard Access

```typescript
import { canViewDashboard } from '../../middleware/rbac';

// Dashboard access for all roles except applicant
router.get('/dashboard', authenticateToken, canViewDashboard(), getDashboard);
router.get('/dashboard/stats', authenticateToken, canViewDashboard(), getDashboardStats);
```

## Hearing Permissions (Registrar Only)

```typescript
import { canApplyHearing, canResolveHearing } from '../../middleware/rbac';

// Apply for hearing (Registrar only)
router.post('/hearings/apply', authenticateToken, canApplyHearing(), applyHearing);

// Resolve hearing (Registrar only)
router.post('/hearings/:id/resolve', authenticateToken, canResolveHearing(), resolveHearing);
```

## Complete Route Example

Here's a complete example of a route file using the RBAC middleware:

```typescript
import { Router } from 'express';
import { authenticateToken, validateRequest } from '../../middleware/auth';
import {
  canViewRegistrations,
  canManageRegistrations,
  canEditRegistrations,
  canDeleteRegistrations,
  canApproveRegistrations,
  canRejectRegistrations
} from '../../middleware/rbac';
import {
  getRegistrations,
  getRegistrationById,
  createRegistration,
  updateRegistration,
  deleteRegistration,
  approveRegistration,
  rejectRegistration
} from '../../controllers/registrationController';
import {
  registrationValidation,
  updateRegistrationValidation,
  registrationIdValidation
} from '../../validations/registration';

const router = Router();

// View registrations (View permission required)
router.get('/', 
  authenticateToken,
  canViewRegistrations(),
  validateRequest,
  getRegistrations
);

// View specific registration (View permission required)
router.get('/:id', 
  authenticateToken,
  canViewRegistrations(),
  registrationIdValidation,
  validateRequest,
  getRegistrationById
);

// Create registration (Create permission required)
router.post('/', 
  authenticateToken,
  canManageRegistrations(),
  registrationValidation,
  validateRequest,
  createRegistration
);

// Update registration (Edit permission required)
router.put('/:id', 
  authenticateToken,
  canEditRegistrations(),
  registrationIdValidation,
  updateRegistrationValidation,
  validateRequest,
  updateRegistration
);

// Delete registration (Delete permission required)
router.delete('/:id', 
  authenticateToken,
  canDeleteRegistrations(),
  registrationIdValidation,
  validateRequest,
  deleteRegistration
);

// Approve registration (Approve permission required)
router.post('/:id/approve', 
  authenticateToken,
  canApproveRegistrations(),
  registrationIdValidation,
  validateRequest,
  approveRegistration
);

// Reject registration (Reject permission required)
router.post('/:id/reject', 
  authenticateToken,
  canRejectRegistrations(),
  registrationIdValidation,
  validateRequest,
  rejectRegistration
);

export default router;
```

## Best Practices

1. **Always use authentication first**: `authenticateToken` should be the first middleware
2. **Use specific permission middleware**: Instead of generic role checks, use specific permission middleware
3. **Validate requests**: Always include `validateRequest` after permission checks
4. **Document permissions**: Add comments explaining what permissions are required for each route
5. **Test thoroughly**: Ensure all permission combinations work as expected
6. **Use appropriate middleware**: Choose between role-based and permission-based middleware based on your needs

## Error Handling

The RBAC middleware automatically handles permission errors:

- **401 Unauthorized**: When no authentication token is provided
- **403 Forbidden**: When the user doesn't have the required permissions
- **404 Not Found**: When the user is not found in the database

## Performance Considerations

- Permission checks are performed on each request
- Consider caching user permissions for frequently accessed routes
- Use database indexes on role_id and permission_id for faster queries
- Consider implementing permission caching for better performance
