import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useTranslation } from "react-i18next";

const PaymentHistory = () => {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;

      try {
        const response = await axios.get("http://13.60.35.161:5000/api/installments/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(response.data);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError(t("paymentHistory.noData"));
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [token, t]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">{t("paymentHistory.title")}</h2>

      {loading ? (
        <p className="text-gray-600">{t("common.loading")}</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((installment) => (
            <div key={installment.id} className="bg-gray-100 p-4 rounded-md shadow-md">
              <h3 className="text-lg font-bold">{installment.product_name}</h3>
              <p className="text-gray-600 text-sm">
                {t("paymentHistory.totalPrice")}: <strong>${installment.product_price}</strong>
              </p>
              <p className="text-green-600 text-sm">
                {t("paymentHistory.status")}: {installment.status}
              </p>
              <p className="text-gray-500 text-xs">
                {t("paymentHistory.completed")}:{" "}
                {new Date(installment.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
