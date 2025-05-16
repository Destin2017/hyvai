import { useState, useEffect, useContext } from "react";
import {
  FaTimes, FaBars, FaMoneyBillWave, FaHistory,
  FaChartLine, FaCheck
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import { useTranslation } from "react-i18next";

const Sidebar = ({ setSelectedTab }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [score, setScore] = useState(null);
  const { token } = useContext(AuthContext);
  const { t } = useTranslation();

  const API_BASE_URL = "http://13.60.35.161:5000";

  useEffect(() => {
    const fetchScore = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_BASE_URL}/api/installments/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let points = 0;
        (res.data || []).forEach((i) => {
          const s = i.second_payment_status?.toLowerCase();
          const t = i.third_payment_status?.toLowerCase();
          if (s === "paid") points += 15;
          else if (s === "missed") points -= 10;
          if (t === "paid") points += 20;
          else if (t === "missed") points -= 15;
        });

        setScore(points);
      } catch (err) {
        console.warn("⚠️ Could not fetch score:", err.message);
      }
    };

    fetchScore();
  }, [token]);

  const handleSelectTab = (tab) => {
    setSelectedTab(tab);
    setIsOpen(false);
  };

  const getBadgeStyle = (pts) => {
    if (pts >= 90) return "bg-green-200 text-green-800 animate-pulse";
    if (pts >= 70) return "bg-blue-100 text-blue-800";
    if (pts >= 50) return "bg-yellow-100 text-yellow-800";
    if (pts >= 30) return "bg-gray-200 text-gray-800";
    return "bg-red-100 text-red-600";
  };

  const getLevelIcon = (pts) => {
    if (pts >= 90) return t("score.legend");
    if (pts >= 70) return t("score.pro");
    if (pts >= 50) return t("score.rising");
    if (pts >= 30) return t("score.beginner");
    return t("score.newbie");
  };

  return (
    <>
      <button
        className="fixed top-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-md md:hidden animate-bounce"
        onClick={() => setIsOpen(true)}
      >
        <FaBars size={22} />
      </button>

      <div className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-white to-blue-50 shadow-2xl p-5 transition-all duration-300 z-40 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">{t("sidebar.dashboardTitle")}</h2>
          <button className="text-gray-600 hover:text-red-500 md:hidden" onClick={() => setIsOpen(false)}>
            <FaTimes size={24} />
          </button>
        </div>

        <ul className="space-y-5 text-gray-700 font-medium">
          <li>
            <button
              onClick={() => handleSelectTab("installmentPlan")}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-blue-100 w-full transition duration-200"
            >
              <FaMoneyBillWave className="text-green-600" />
              <span>{t("sidebar.myInstallment")}</span>
            </button>
          </li>

          <li>
            <button
              onClick={() => handleSelectTab("paymentHistory")}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-green-100 w-full transition duration-200"
            >
              <FaHistory className="text-blue-600" />
              <span>{t("sidebar.paymentHistory")}</span>
            </button>
          </li>

          <li>
            <button
              onClick={() => handleSelectTab("creditReadiness")}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-purple-100 w-full transition duration-200"
            >
              <div className="flex items-center space-x-3">
                <FaChartLine className="text-purple-700" />
                <span>{t("sidebar.creditReadiness")}</span>
              </div>
              {score !== null && (
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getBadgeStyle(score)}`}>
                  {getLevelIcon(score)} ({score}pts)
                </span>
              )}
            </button>
          </li>

          <li>
            <button
              onClick={() => handleSelectTab("applicationStatus")}
              className="flex items-center space-x-3 p-3 rounded-xl hover:bg-yellow-100 w-full transition duration-200"
            >
              <FaCheck className="text-yellow-700" />
              <span>{t("sidebar.applicationStatus")}</span>
            </button>
          </li>
        </ul>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
