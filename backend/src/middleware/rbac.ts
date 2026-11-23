import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import { AppError } from '../utils/errors';
import { findUserById } from '../services/UserService';
import { userHasPermission } from '../services/PermissionService';

export const requirePermission = (resource: string, action: string) => {
  return async (req: IAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const user = await findUserById(req.user.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.is_active) {
        throw new AppError('Account is deactivated', 401);
      }

      const allowed = await userHasPermission(user as any, resource, action);
      if (!allowed) {
        throw new AppError(`Insufficient permissions: ${action} on ${resource}`, 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAnyPermission = (permissions: Array<{ resource: string; action: string }>) => {
  return async (req: IAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const user = await findUserById(req.user.userId);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.is_active) {
        throw new AppError('Account is deactivated', 401);
      }

      for (const p of permissions) {
        if (await userHasPermission(user as any, p.resource, p.action)) {
          return next();
        }
      }

      throw new AppError('Insufficient permissions for this resource', 403);
    } catch (error) {
      next(error);
    }
  };
};

export const requireAllPermissions = (permissions: Array<{ resource: string; action: string }>) => {
  return async (req: IAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const user = await findUserById(req.user.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.is_active) {
        throw new AppError('Account is deactivated', 401);
      }

      for (const p of permissions) {
        if (!(await userHasPermission(user as any, p.resource, p.action))) {
          throw new AppError(`Insufficient permissions: ${p.action} on ${p.resource}`, 403);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Role-based middleware (for backward compatibility)
export const requireRole = (roles: string[]) => {
  return async (req: IAuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      const user = await findUserById(req.user.userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.is_active) {
        throw new AppError('Account is deactivated', 401);
      }

      // Check if user's role name is in the allowed roles
      if (!user.role || !roles.includes(user.role.name)) {
        throw new AppError('Insufficient role permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Specific role middleware functions based on the permissions table
export const requireAdminRole = () => {
  return requireRole(['admin']);
};

export const requireRegistrarRole = () => {
  return requireRole(['registrar']);
};

export const requireApproverRole = () => {
  return requireRole(['registrar', 'joint_registrar', 'senior_inspector', 'deputy_registrar', 'jics_jacs', 'sics_sacs']);
};

export const requireViewerRole = () => {
  return requireRole(['registrar', 'joint_registrar', 'senior_inspector', 'deputy_registrar', 'dealing_assistant', 'field_inspector', 'jics_jacs', 'sics_sacs']);
};

export const requireApplicantRole = () => {
  return requireRole(['applicant']);
};

// Permission-based middleware for common operations
export const canCreate = (resource: string) => requirePermission(resource, 'create');
export const canRead = (resource: string) => requirePermission(resource, 'read');
export const canUpdate = (resource: string) => requirePermission(resource, 'update');
export const canDelete = (resource: string) => requirePermission(resource, 'delete');
export const canApprove = (resource: string) => requirePermission(resource, 'approve');
export const canReject = (resource: string) => requirePermission(resource, 'reject');
export const canView = (resource: string) => requirePermission(resource, 'view');
export const canEdit = (resource: string) => requirePermission(resource, 'edit');

// Resource-specific permission middleware
export const canManageUsers = () => requirePermission('user', 'create');
export const canViewUsers = () => requirePermission('user', 'view');
export const canEditUsers = () => requirePermission('user', 'edit');
export const canDeleteUsers = () => requirePermission('user', 'delete');

export const canManageSocieties = () => requirePermission('society', 'create');
export const canViewSocieties = () => requirePermission('society', 'view');
export const canEditSocieties = () => requirePermission('society', 'edit');
export const canDeleteSocieties = () => requirePermission('society', 'delete');
export const canApproveSocieties = () => requirePermission('society', 'approve');
export const canRejectSocieties = () => requirePermission('society', 'reject');

export const canManageRegistrations = () => requirePermission('registration', 'create');
export const canViewRegistrations = () => requirePermission('registration', 'view');
export const canEditRegistrations = () => requirePermission('registration', 'edit');
export const canDeleteRegistrations = () => requirePermission('registration', 'delete');
export const canApproveRegistrations = () => requirePermission('registration', 'approve');
export const canRejectRegistrations = () => requirePermission('registration', 'reject');

export const canManageAnnualReturns = () => requirePermission('annual-return', 'create');
export const canViewAnnualReturns = () => requirePermission('annual-return', 'view');
export const canEditAnnualReturns = () => requirePermission('annual-return', 'edit');
export const canDeleteAnnualReturns = () => requirePermission('annual-return', 'delete');
export const canApproveAnnualReturns = () => requirePermission('annual-return', 'approve');
export const canRejectAnnualReturns = () => requirePermission('annual-return', 'reject');

export const canManageAmendments = () => requirePermission('amendment', 'create');
export const canViewAmendments = () => requirePermission('amendment', 'view');
export const canEditAmendments = () => requirePermission('amendment', 'edit');
/** Applicants often have create but not edit; allow draft submit/resubmit via PUT. */
export const canCreateOrEditAmendments = () =>
  requireAnyPermission([
    { resource: 'amendment', action: 'create' },
    { resource: 'amendment', action: 'edit' }
  ]);
export const canDeleteAmendments = () => requirePermission('amendment', 'delete');
export const canApproveAmendments = () => requirePermission('amendment', 'approve');
export const canRejectAmendments = () => requirePermission('amendment', 'reject');

export const canManageElectionRequests = () => requirePermission('election-request', 'create');
export const canViewElectionRequests = () => requirePermission('election-request', 'view');
export const canEditElectionRequests = () => requirePermission('election-request', 'edit');
export const canDeleteElectionRequests = () => requirePermission('election-request', 'delete');
export const canApproveElectionRequests = () => requirePermission('election-request', 'approve');
export const canRejectElectionRequests = () => requirePermission('election-request', 'reject');

export const canManageAuditRequests = () => requirePermission('audit-request', 'create');
export const canViewAuditRequests = () => requirePermission('audit-request', 'view');
export const canEditAuditRequests = () => requirePermission('audit-request', 'edit');
export const canDeleteAuditRequests = () => requirePermission('audit-request', 'delete');
export const canApproveAuditRequests = () => requirePermission('audit-request', 'approve');
export const canRejectAuditRequests = () => requirePermission('audit-request', 'reject');

export const canManageLiquidations = () => requirePermission('liquidation', 'create');
export const canViewLiquidations = () => requirePermission('liquidation', 'view');
export const canEditLiquidations = () => requirePermission('liquidation', 'edit');
export const canDeleteLiquidations = () => requirePermission('liquidation', 'delete');
export const canApproveLiquidations = () => requirePermission('liquidation', 'approve');
export const canRejectLiquidations = () => requirePermission('liquidation', 'reject');

export const canManageConversions = () => requirePermission('conversion', 'create');
export const canViewConversions = () => requirePermission('conversion', 'view');
export const canEditConversions = () => requirePermission('conversion', 'edit');
export const canDeleteConversions = () => requirePermission('conversion', 'delete');
export const canApproveConversions = () => requirePermission('conversion', 'approve');
export const canRejectConversions = () => requirePermission('conversion', 'reject');


export const canManageEnquiryRequests = () => requirePermission('enquiry-request', 'create');
export const canViewEnquiryRequests = () => requirePermission('enquiry-request', 'view');
export const canEditEnquiryRequests = () => requirePermission('enquiry-request', 'edit');
export const canDeleteEnquiryRequests = () => requirePermission('enquiry-request', 'delete');
export const canApproveEnquiryRequests = () => requirePermission('enquiry-request', 'approve');
export const canRejectEnquiryRequests = () => requirePermission('enquiry-request', 'reject');

export const canManageAppeals = () => requirePermission('appeal', 'create');
export const canViewAppeals = () => requirePermission('appeal', 'view');
export const canEditAppeals = () => requirePermission('appeal', 'edit');
export const canDeleteAppeals = () => requirePermission('appeal', 'delete');
export const canApproveAppeals = () => requirePermission('appeal', 'approve');
export const canRejectAppeals = () => requirePermission('appeal', 'reject');

/** Officers reviewing appeals / scheduling hearings (not applicant create). */
export const canReviewAppeals = () =>
  requireAnyPermission([
    { resource: 'appeal', action: 'approve' },
    { resource: 'appeal', action: 'reject' },
    { resource: 'appeal', action: 'hearing' },
    { resource: 'hearing', action: 'apply' },
    { resource: 'hearing', action: 'resolve' },
  ]);

/** Read appeal review/hearing records (viewers + workflow officers). */
export const canViewAppealReviews = () =>
  requireAnyPermission([
    { resource: 'appeal', action: 'view' },
    { resource: 'appeal', action: 'approve' },
    { resource: 'appeal', action: 'reject' },
    { resource: 'appeal', action: 'hearing' },
    { resource: 'hearing', action: 'apply' },
    { resource: 'hearing', action: 'resolve' },
  ]);

// Dashboard access (all roles except applicant)
export const canViewDashboard = () => requireAnyPermission([
  { resource: 'dashboard', action: 'view' }
]);

// Settings access (admin only)
export const canManageSettings = () => requirePermission('settings', 'create');

// Hearing permissions (registrar only)
export const canApplyHearing = () => requirePermission('hearing', 'apply');
export const canResolveHearing = () => requirePermission('hearing', 'resolve');

export const canManageEnquiryRequestsWithRoleFallback = () => requirePermission('enquiry-request', 'create');

export const canViewEnquiryRequestsWithRoleFallback = () => requirePermission('enquiry-request', 'view');

export const canManageAppealsWithRoleFallback = () => requirePermission('appeal', 'create');

export const canViewAppealsWithRoleFallback = () => requirePermission('appeal', 'view');
