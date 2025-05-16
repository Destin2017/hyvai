import { useState, useEffect, useCallback, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import PaymentHistory from "../components/PaymentHistory";
import CreditReadiness from "../components/CreditReadiness";
import ApplicationStatus from "../components/ApplicationStatus";
import axios from "axios";
import { FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import { useTranslation } from "react-i18next"; // 🌍

const EmployeeDashboard = () => {
  const { t } = useTranslation(); // 🌐 hook
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user } = useContext(AuthContext);

  const [selectedTab, setSelectedTab] = useState("installmentPlan");
  const [installmentPlan, setInstallmentPlan] = useState(null);
  const [productDetails, setProductDetails] = useState(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [hasRejected, setHasRejected] = useState(false);
  const [rejectedInstallments, setRejectedInstallments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = "http://13.60.35.161:5000";

  const applyForInstallment = useCallback(async () => {
    const productFromStorage = localStorage.getItem("selectedProduct");
    if (!productFromStorage) return;

    const parsed = JSON.parse(productFromStorage);
    try {
      await axios.post(`${API_BASE_URL}/api/installments/apply`, { product_id: parsed.id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      localStorage.removeItem("selectedProduct");
    } catch (err) {
      console.error("❌ Error applying for installment:", err);
    }
  }, [token]);

  const fetchInstallmentPlan = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/installments/plan`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.data || !res.data.installmentPlan) {
        throw new Error("No active installment found.");
      }

      setInstallmentPlan(res.data.installmentPlan);
      setProductDetails(res.data.product);
      setPendingApproval(false);
      setError(null);
    } catch (err) {
      if (err.response?.status === 404) {
        setPendingApproval(true);
      } else {
        setError(t("dashboard.errorLoading"));
      }
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  const fetchRejectedInstallments = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/installments/rejected`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const rejectedData = res.data || [];
      setRejectedInstallments(rejectedData);
      setHasRejected(rejectedData.length > 0);
    } catch (err) {
      setHasRejected(false);
    }
  }, [token]);

  const fetchPaymentHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/installments/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentHistory(res.data || []);
    } catch (err) {
      console.warn("No completed installments.");
    }
  }, [token]);

  useEffect(() => {
    if (!token) return navigate("/login", { replace: true });

    applyForInstallment();
    fetchInstallmentPlan();
    fetchRejectedInstallments();
    fetchPaymentHistory();
  }, [
    token,
    navigate,
    applyForInstallment,
    fetchInstallmentPlan,
    fetchRejectedInstallments,
    fetchPaymentHistory
  ]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "paid": return <FaCheckCircle className="text-green-500 text-lg" />;
      case "due": return <FaClock className="text-yellow-500 text-lg" />;
      case "overdue": return <FaTimesCircle className="text-red-500 text-lg" />;
      default: return <FaClock className="text-gray-400 text-lg" />;
    }
  };

  const calculateProgress = () => {
    if (!installmentPlan) return 0;
    let total = 0, paid = 0;
    Object.values(installmentPlan).forEach((p) => {
      total += p.amount;
      if (p.status === "paid") paid += p.amount;
    });
    return (paid / total) * 100;
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-gray-100 to-blue-50">
      <Sidebar setSelectedTab={setSelectedTab} />
      
      <div className="flex-1">
        <Header />
        
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-indigo-700">
              👋 {t("dashboard.welcome")}, {user?.name || t("guest")}!
            </h1>
            <p className="text-sm text-gray-600 mt-1 italic">
              {t("dashboard.motivation")}
            </p>
          </div>

          {loading ? (
            <div className="text-center text-indigo-500 text-lg animate-pulse">{t("dashboard.loading")}</div>
          ) : error ? (
            <p className="text-red-500 text-center font-semibold">{error}</p>
          ) : (
            <>
              {selectedTab === "installmentPlan" && (
                <div className="bg-white p-6 rounded-xl shadow-lg transition-all hover:shadow-2xl">
                  <h2 className="text-2xl font-bold mb-4 text-center text-blue-700">{t("dashboard.installmentPlan")}</h2>

                  {hasRejected ? (
                    <div className="bg-red-100 text-red-600 text-center p-4 rounded-md font-semibold">
                      {t("dashboard.rejected")}
                    </div>
                  ) : pendingApproval ? (
                    <div className="bg-yellow-100 text-yellow-700 text-center p-4 rounded-md font-semibold">
                      {t("dashboard.pending")}
                    </div>
                  ) : installmentPlan ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          {
                            label: t("dashboard.upfront"),
                            data: installmentPlan.initialPayment,
                            bg: "bg-indigo-100"
                          },
                          {
                            label: t("dashboard.thirtyDays"),
                            data: installmentPlan.secondInstallment,
                            bg: "bg-green-100"
                          },
                          {
                            label: t("dashboard.sixtyDays"),
                            data: installmentPlan.finalInstallment,
                            bg: "bg-yellow-100"
                          }
                        ].map((phase, i) => (
                          <div key={i} className={`${phase.bg} p-4 rounded-lg shadow-sm text-center`}>
                            <h4 className="font-bold">{phase.label}</h4>
                            <p className="text-2xl font-bold">${phase.data.amount.toFixed(2)}</p>
                            <p className="text-sm text-gray-700 flex justify-center items-center gap-1">
                              {getStatusIcon(phase.data.status)} {phase.data.status}
                            </p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-6">
                        <h4 className="text-center text-lg font-semibold text-indigo-600">{t("dashboard.progressTitle")}</h4>
                        <div className="bg-gray-300 rounded-full h-5 mt-2 overflow-hidden">
                          <div
                            className="h-full transition-all duration-500 ease-out"
                            style={{
                              width: `${calculateProgress()}%`,
                              background: `linear-gradient(to right, #00c9ff, #92fe9d)`
                            }}
                          />
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-1">
                          {calculateProgress().toFixed(0)}% {t("dashboard.progressText")}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-600 mt-4">
                      {t("dashboard.noInstallment")}
                    </div>
                  )}
                </div>
              )}

              {selectedTab === "paymentHistory" && <PaymentHistory history={paymentHistory} />}
              {selectedTab === "creditReadiness" && <CreditReadiness />}
              {selectedTab === "applicationStatus" && <ApplicationStatus rejected={rejectedInstallments} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
