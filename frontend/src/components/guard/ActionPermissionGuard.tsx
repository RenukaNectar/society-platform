import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { isAdminRole, permissionMatches } from "../../utils/permissionResources";

type Props = {
  children: React.ReactNode;
  action: string;
  resource: string;
};

const ActionPermissionGuard = ({ children, action, resource }: Props) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const permissions = useSelector(
    (state: RootState) => state.permissions.permissions
  );

  if (isAdminRole(user?.role)) {
    return <>{children}</>;
  }

  const hasPermission = permissionMatches(permissions, resource, action);

  if (!hasPermission) return null;

  return <>{children}</>;
};

export default ActionPermissionGuard;