import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  module?: string;
  action?: 'view' | 'edit' | 'delete' | 'add' | 'approve' | 'reject';
  fallback?: React.ReactNode;
  showIfNoPermission?: boolean;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions: permissionList,
  requireAll = false,
  module,
  action,
  fallback = null,
  showIfNoPermission = false,
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, canPerformAction } = usePermissions();

  // If no permission checks are specified, show children
  if (!permission && !permissionList && !module) {
    return <>{children}</>;
  }

  let hasAccess = false;

  // Check single permission
  if (permission) {
    hasAccess = hasPermission(permission);
  }
  // Check multiple permissions
  else if (permissionList) {
    hasAccess = requireAll ? hasAllPermissions(permissionList) : hasAnyPermission(permissionList);
  }
  // Check module action
  else if (module && action) {
    hasAccess = canPerformAction(module, action);
  }

  // If showIfNoPermission is true, show children when user doesn't have permission
  if (showIfNoPermission) {
    hasAccess = !hasAccess;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// Convenience components for common permission checks
export const CanView: React.FC<{ module: string; children: React.ReactNode; fallback?: React.ReactNode }> = ({
  module,
  children,
  fallback
}) => (
  <PermissionGuard module={module} action="view" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CanEdit: React.FC<{ module: string; children: React.ReactNode; fallback?: React.ReactNode }> = ({
  module,
  children,
  fallback
}) => (
  <PermissionGuard module={module} action="edit" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CanDelete: React.FC<{ module: string; children: React.ReactNode; fallback?: React.ReactNode }> = ({
  module,
  children,
  fallback
}) => (
  <PermissionGuard module={module} action="delete" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CanAdd: React.FC<{ module: string; children: React.ReactNode; fallback?: React.ReactNode }> = ({
  module,
  children,
  fallback
}) => (
  <PermissionGuard module={module} action="add" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CanApprove: React.FC<{ module: string; children: React.ReactNode; fallback?: React.ReactNode }> = ({
  module,
  children,
  fallback
}) => (
  <PermissionGuard module={module} action="approve" fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CanReject: React.FC<{ module: string; children: React.ReactNode; fallback?: React.ReactNode }> = ({
  module,
  children,
  fallback
}) => (
  <PermissionGuard module={module} action="reject" fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Role-based components
export const SuperAdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => {
  const { isSuperAdmin } = usePermissions();
  return isSuperAdmin() ? <>{children}</> : <>{fallback}</>;
};

export const RegistrarOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => {
  const { isRegistrar } = usePermissions();
  return isRegistrar() ? <>{children}</> : <>{fallback}</>;
};

export const SocietyUserOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => {
  const { isSocietyUser } = usePermissions();
  return isSocietyUser() ? <>{children}</> : <>{fallback}</>;
};

export const NormalUserOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback
}) => {
  const { isSocietyUser } = usePermissions();
  return isSocietyUser() ? <>{children}</> : <>{fallback}</>;
}; 