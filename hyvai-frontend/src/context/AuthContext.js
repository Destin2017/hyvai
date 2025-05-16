import { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const getToken = () => sessionStorage.getItem("userToken") || null;

  const [user, setUser] = useState(() => {
    const storedUser = sessionStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(getToken);
  const [loading, setLoading] = useState(true);

  // ✅ Apply for Installment AFTER login
  const applyForInstallment = useCallback(async (productId) => {
    if (!token) {
      console.error("❌ Cannot apply for installment: No token found!");
      return;
    }

    try {
      console.log(`📡 Sending Installment Request for Product ID: ${productId}`);
      const response = await axios.post(
        "http://13.60.35.161:5000/api/installments/apply",
        { product_id: productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("✅ Installment application submitted:", response.data);
    } catch (error) {
      console.error("❌ Error applying for installment:", error.response?.data || error.message);
    }
  }, [token]);

  // ✅ Handle User Authentication
  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        console.warn("🔴 No token found. User is not logged in.");
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("http://13.60.35.161:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (response.data) {
          setUser(response.data);
          sessionStorage.setItem("user", JSON.stringify(response.data));

          // ✅ Check for pending product selection before login
          const pendingProductId = sessionStorage.getItem("pendingProduct");
          if (pendingProductId) {
            console.log(`🚀 Auto-applying for installment: Product ID ${pendingProductId}`);
            await applyForInstallment(pendingProductId);
            sessionStorage.removeItem("pendingProduct");
          }
        }
      } catch (error) {
        console.error("❌ Error fetching user:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [token, applyForInstallment]);

  const login = async (email, password) => {
    try {
      console.log("🔐 Logging in user...");
      const response = await axios.post(
        "http://13.60.35.161:5000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );

      if (!response.data || !response.data.token) {
        throw new Error("❌ Authentication failed. No token received.");
      }

      sessionStorage.setItem("userToken", response.data.token);
      sessionStorage.setItem("user", JSON.stringify(response.data.user));

      setToken(response.data.token);
      setUser(response.data.user);

      console.log("✅ User Logged in Successfully!");

      return response.data;
    } catch (error) {
      console.error("❌ Login Error:", error);
      throw error.response?.data?.message || "Login failed";
    }
  };

  const logout = () => {
    console.log("🔴 Logging out user...");
    sessionStorage.clear();
    setUser(null);
    setToken(null);
    
    // ✅ Redirect to Home/Products Page after logout
    window.location.href = "/"; // Forces a reload to ensure state resets
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {loading ? <div className="text-center mt-20 text-gray-600">Loading...</div> : children}
    </AuthContext.Provider>
  );
};
