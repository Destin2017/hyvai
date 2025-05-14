import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

const ApplicationStatus = ({ rejected = null }) => {
  const { token } = useContext(AuthContext);
  const { t } = useTranslation();
  const [rejectedInstallments, setRejectedInstallments] = useState([]);
  const [loading, setLoading] = useState(!rejected);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRejectedInstallments = async () => {
      if (!token || rejected) return;

      try {
        const response = await axios.get("http://localhost:5000/api/installments/rejected", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setRejectedInstallments(response.data);
        setError("");
      } catch (error) {
        console.error("❌ Error fetching rejected applications:", error?.response || error);
        setError(
          error?.response?.data?.message || t("applicationStatus.errorFetch")
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRejectedInstallments();
  }, [token, rejected, t]);

  const dataToDisplay = rejected || rejectedInstallments;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-center mb-6">
        📑 {t("applicationStatus.title")}
      </h2>

      {loading ? (
        <p className="text-center text-gray-500">{t("common.loading")}</p>
      ) : error ? (
        <p className="text-center text-red-500">{error}</p>
      ) : dataToDisplay.length === 0 ? (
        <p className="text-center text-gray-600">{t("applicationStatus.noneFound")}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataToDisplay.map((installment) => (
            <div key={installment.id} className="bg-white shadow-md p-4 rounded-lg">
              <h3 className="text-lg font-semibold">{installment.product_name}</h3>
              <p className="text-gray-700">
                💲{t("applicationStatus.price")}:{" "}
                <strong>${Number(installment.product_price || 0).toFixed(2)}</strong>
              </p>
              <p className="text-red-500 font-semibold">🚫 {t("applicationStatus.statusRejected")}</p>
              <p className="text-gray-600">
                📅 {t("applicationStatus.date")}:{" "}
                {new Date(installment.updated_at).toLocaleDateString()}
              </p>
              <p className="text-gray-700">
                📝 {t("applicationStatus.reason")}:{" "}
                {installment.rejection_reason || t("applicationStatus.noReason")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationStatus;
