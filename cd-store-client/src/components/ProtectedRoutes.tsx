import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  allowedRoles?: ("ADMIN" | "CUSTOMER")[];
};

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user, role, isLoading } = useAuth();
  const location = useLocation();

  // Wait until Supabase finishes checking the session
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  // Logged in but wrong role
  if (allowedRoles && !role) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Unable to determine your account role.</p>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(role!)) {
    return <Navigate to="/products" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;