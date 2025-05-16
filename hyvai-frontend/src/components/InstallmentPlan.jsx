import { useState, useEffect } from "react";
import axios from "axios";
import InstallmentBreakdown from "../components/InstallmentBreakdown"; // ✅ Using reusable component

const InstallmentPlan = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInstallmentPlan = async () => {
      try {
        const token = sessionStorage.getItem("userToken");
        if (!token) {
          throw new Error("User authentication required. Please log in again.");
        }

        console.log("🔹 Fetching installment plan...");
        const response = await axios.get("http://13.60.35.161:5000/api/installments/plan", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.data || !response.data.product) {
          throw new Error("No active installment plan found.");
        }

        console.log("✅ Installment plan loaded successfully:", response.data);
        setProduct(response.data.product);
      } catch (error) {
        console.error("❌ Error fetching installment plan:", error.message);
        setError("Failed to load installment plan.");
      } finally {
        setLoading(false);
      }
    };

    fetchInstallmentPlan(); // ✅ Calling function inside useEffect
  }, []); // ✅ Fix: No missing dependencies

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Installment Plan</h2>

      {loading ? <p>Loading...</p> : error ? <p className="text-red-500">{error}</p> : <>
        <InstallmentBreakdown product={product} />
      </>}
    </div>
  );
};

export default InstallmentPlan;
