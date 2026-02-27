// src/components/common/PermissionGuard.jsx

import { Navigate } from "react-router-dom";
import { Shield, AlertTriangle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { 
  cadminRoleHasPermission, 
  cadminRoleHasAnyPermission,
  canAccessCAdminRoute 
} from "../../config/cadminPermissions";

/**
 * ============================================
 * PERMISSION GUARD COMPONENT
 * ============================================
 * 
 * Protects routes based on admin permissions.
 * 
 * Usage:
 *   <PermissionGuard permission="shops:view">
 *     <ShopsPage />
 *   </PermissionGuard>
 * 
 *   <PermissionGuard permissions={["broadcast:view", "enquiries:view"]}>
 *     <CommunicationsPage />
 *   </PermissionGuard>
 * 
 *   <PermissionGuard roles={["SUPER_CADMIN"]}>
 *     <AdminsPage />
 *   </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,        // Single permission required
  permissions,       // Array of permissions (any match = allowed)
  roles,            // Array of roles allowed
  fallback = "/dashboard",
  showForbidden = true,
}) {
  const { admin, loading } = useAuth();

  // Show nothing while loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#05015A]" />
      </div>
    );
  }

  // Not authenticated
  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  const role = admin.role?.toUpperCase();

  // Check single permission
  if (permission) {
    const hasAccess = cadminRoleHasPermission(role, permission);
    if (!hasAccess) {
      if (showForbidden) {
        return <ForbiddenPage permission={permission} />;
      }
      return <Navigate to={fallback} replace />;
    }
  }

  // Check multiple permissions (any match)
  if (permissions?.length > 0) {
    const hasAccess = cadminRoleHasAnyPermission(role, permissions);
    if (!hasAccess) {
      if (showForbidden) {
        return <ForbiddenPage />;
      }
      return <Navigate to={fallback} replace />;
    }
  }

  // Check roles
  if (roles?.length > 0) {
    const hasRole = roles.map((r) => r.toUpperCase()).includes(role);
    if (!hasRole) {
      if (showForbidden) {
        return <ForbiddenPage requiredRoles={roles} />;
      }
      return <Navigate to={fallback} replace />;
    }
  }

  return children;
}

/**
 * Route guard using route-permission mapping
 */
export function RoutePermissionGuard({ children, route }) {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#05015A]" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  const role = admin.role?.toUpperCase();

  if (!canAccessCAdminRoute(role, route)) {
    return <ForbiddenPage />;
  }

  return children;
}

/**
 * Forbidden page component
 */
function ForbiddenPage({ permission, requiredRoles }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <Shield className="w-10 h-10 text-red-500" />
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Access Denied
      </h1>
      
      <p className="text-gray-600 max-w-md mb-6">
        You don't have permission to access this page.
        Please contact your administrator if you believe this is an error.
      </p>

      {/* Debug info in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-sm">
          <p className="font-medium text-gray-700 mb-2">Debug Info:</p>
          {permission && (
            <p className="text-gray-600">
              Required permission: <code className="bg-gray-200 px-1 rounded">{permission}</code>
            </p>
          )}
          {requiredRoles && (
            <p className="text-gray-600">
              Required roles: <code className="bg-gray-200 px-1 rounded">{requiredRoles.join(", ")}</code>
            </p>
          )}
        </div>
      )}

      <a
        href="/dashboard"
        className="mt-6 px-6 py-2 bg-[#05015A] text-white rounded-lg hover:bg-[#05015A]/90 transition-colors"
      >
        Go to Dashboard
      </a>
    </div>
  );
}

/**
 * Higher-order component for permission checking
 */
export function withPermission(Component, permission) {
  return function PermissionWrappedComponent(props) {
    return (
      <PermissionGuard permission={permission}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

/**
 * Hook-style permission check for inline use
 */
export function useCanAccess(permission) {
  const { admin } = useAuth();
  const role = admin?.role?.toUpperCase();
  
  if (!role) return false;
  return cadminRoleHasPermission(role, permission);
}

export default PermissionGuard;