
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { ShieldX, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  // Wait for the authentication session and role
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    );
  }

  // Redirect unauthenticated users to login
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Handle missing role
  if (allowedRoles && !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <ShieldX className="mx-auto h-12 w-12 text-amber-500" />

          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Unable to Verify Your Role
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-600">
            We couldn't determine your account permissions.
            Please try again or contact the administrator.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  // Display access denied instead of redirecting
  if (allowedRoles && !allowedRoles.includes(role!)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900">
            Access Denied
          </h1>

          <p className="mt-3 text-sm leading-6 text-gray-600">
            Sorry, your account doesn't have permission to access
            this page. Please contact your administrator if you
            believe this is a mistake.
          </p>

          <p className="mt-3 text-xs text-gray-400">
            Your current role: {role}
          </p>

          <Link
            to={role === "CUSTOMER" ? "/products" : "/admin"}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;