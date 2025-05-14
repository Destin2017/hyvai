import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "../context/AuthContext";

import Login from "../pages/Login";
import Register from "../pages/Register";
import EmployeeDashboard from "../pages/EmployeeDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import NotFound from "../pages/NotFound";
import Unauthorized from "../pages/Unauthorized";
import ProtectedRoute from "./ProtectedRoute";
import ProductsPage from "../pages/ProductsPage";
import ProductDetails from "../pages/ProductDetails";
import PaymentHistory from "../components/PaymentHistory";
import LanguageSwitcher from "../components/LanguageSwitcher"; // 🌍 Import here

const AppContent = () => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="text-center mt-20 text-gray-600">Loading...</div>;
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/login" element={user ? <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard"} replace /> : <Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/employee/payment-history"
          element={<ProtectedRoute requiredRole="employee"><PaymentHistory /></ProtectedRoute>}
        />
        <Route
          path="/employee/dashboard"
          element={<ProtectedRoute requiredRole="employee"><EmployeeDashboard /></ProtectedRoute>}
        />
        <Route
          path="/admin/dashboard"
          element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>}
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* 🌐 Floating Language Switcher visible globally */}
      <LanguageSwitcher />
    </>
  );
};

const AppRouter = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default AppRouter;
