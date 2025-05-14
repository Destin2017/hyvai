import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="text-center mt-20 text-gray-600">Loading...</div>;
  }

  // Ensure user object is not null
  if (!user || !user.role) {
    console.warn("No authenticated user or role missing, redirecting to login...");
    return <Navigate to="/login" replace />;
  }

  //  Verify role before granting access
  if (requiredRole && user.role !== requiredRole) {
    console.warn("Unauthorized access attempt by:", user);
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
