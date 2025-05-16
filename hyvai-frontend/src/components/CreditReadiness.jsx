import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { Line } from "react-chartjs-2";
import { useTranslation } from "react-i18next";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  FaArrowUp,
  FaArrowDown,
  FaTrophy,
  FaExclamationCircle,
} from "react-icons/fa";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const CreditReadiness = () => {
  const { t } = useTranslation();
  const { token } = useContext(AuthContext);
  const API_BASE_URL = "http://13.60.35.161:5000";

  const [score, setScore] = useState(0);
  const [rank, setRank] = useState(t("credit.rank.newbie"));
  const [status, setStatus] = useState(t("credit.loading"));
  const [installments, setInstallments] = useState([]);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deductionEligible, setDeductionEligible] = useState(false);

  const calculateDueDates = (upfrontPaymentDate) => {
    const start = new Date(upfrontPaymentDate);
    const addDays = (d) => {
      const date = new Date(start);
      date.setDate(date.getDate() + d);
      return date;
    };
    return {
      secondDue: addDays(30),
      thirdDue: addDays(60),
    };
  };

  const getCountdown = (date) => {
    const days = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} ${t("credit.daysLeft")}` : t("credit.overdue");
  };

  const formatDate = (d) => new Date(d).toLocaleDateString();

  const determineRank = (points) => {
    if (points >= 90) return t("credit.rank.legend");
    if (points >= 70) return t("credit.rank.pro");
    if (points >= 50) return t("credit.rank.rising");
    if (points >= 30) return t("credit.rank.consistent");
    return t("credit.rank.newbie");
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const historyRes = await axios.get(`${API_BASE_URL}/api/installments/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const paidInstallments = historyRes.data || [];
        setInstallments(paidInstallments);

        let points = 0;
        let approvedCount = 0;

        paidInstallments.forEach((i) => {
          const second = i.second_payment_status?.toLowerCase();
          const third = i.third_payment_status?.toLowerCase();
          if (second === "paid") points += 15;
          else if (second === "missed") points -= 10;
          if (third === "paid") points += 20;
          else if (third === "missed") points -= 15;
          if (second === "paid" && third === "paid") approvedCount += 1;
        });

        setScore(points);
        setRank(determineRank(points));
        setStatus(
          points >= 80 && approvedCount >= 3
            ? t("credit.status.bonus")
            : points <= -30
            ? t("credit.status.risk")
            : t("credit.status.encouragement")
        );
        setDeductionEligible(points >= 80 && approvedCount >= 3);

        const trendRes = await axios.get(`${API_BASE_URL}/api/installments/score-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setScoreHistory(trendRes.data || []);
      } catch (err) {
        console.error("Error fetching credit readiness data:", err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [token, t]);

  const scoreChartData = {
    labels: scoreHistory.map((item) => new Date(item.recorded_at).toLocaleDateString()),
    datasets: [
      {
        label: t("credit.chartLabel"),
        data: scoreHistory.map((item) => item.score),
        fill: true,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="p-6">
      <h2 className="text-3xl font-extrabold text-indigo-700 text-center mb-6">
        ⚡ {t("credit.title")}
      </h2>

      {loading ? (
        <p className="text-center text-gray-500">{t("credit.fetching")}</p>
      ) : (
        <>
          <div className="bg-white shadow-xl p-6 rounded-xl text-center mb-6">
            <h3 className="text-xl font-semibold">{t("credit.points")}</h3>
            <div className="text-5xl font-black text-blue-600 mt-2">{score} pts</div>
            <p className={`mt-2 text-md font-medium ${score >= 0 ? "text-green-600" : "text-red-600"}`}>
              {score >= 0 ? <FaArrowUp className="inline mr-1" /> : <FaArrowDown className="inline mr-1" />}
              {status}
            </p>
            <p className="text-md mt-1">{t("credit.rank.label")}: <strong>{rank}</strong></p>

            <div className="mt-4 w-full bg-gray-300 rounded-full h-4">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(score, 100)}%`,
                  backgroundColor: score >= 80 ? "#22c55e" : score >= 50 ? "#3b82f6" : "#f97316",
                }}
              ></div>
            </div>
          </div>

          {deductionEligible && (
            <div className="bg-green-100 text-green-900 p-4 rounded-lg text-center mb-6 font-semibold shadow-md animate-pulse">
              <FaTrophy className="inline mr-2 text-xl" />
              {t("credit.bonus")}
            </div>
          )}

          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <Line data={scoreChartData} />
            <p className="text-sm text-gray-600 mt-3 text-center">{t("credit.trend")}</p>
          </div>

          <h3 className="text-lg font-bold mb-3 text-gray-700">{t("credit.milestones")}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {installments.map((inst) => {
              const baseDate = inst.upfront_payment_date || inst.created_at;
              const { secondDue, thirdDue } = calculateDueDates(baseDate);
              const missed = ["missed", "overdue"];

              return (
                <div key={inst.id} className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl shadow">
                  <h4 className="font-bold text-lg mb-1">{inst.product_name}</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    {t("credit.price")}: ${parseFloat(inst.product_price).toFixed(2)}
                  </p>

                  <div className="text-sm">
                    <p>
                      📆 {t("credit.secondPayment")}: <strong>{inst.second_payment_status}</strong> – <span className="text-gray-700">{formatDate(secondDue)} ({getCountdown(secondDue)})</span>
                    </p>
                    <p>
                      ⏳ {t("credit.thirdPayment")}: <strong>{inst.third_payment_status}</strong> – <span className="text-gray-700">{formatDate(thirdDue)} ({getCountdown(thirdDue)})</span>
                    </p>
                  </div>

                  {missed.includes(inst.second_payment_status?.toLowerCase()) ||
                  missed.includes(inst.third_payment_status?.toLowerCase()) ? (
                    <p className="text-sm text-red-600 mt-2 font-medium">
                      <FaExclamationCircle className="inline mr-1" />
                      {t("credit.delayImpact")}
                    </p>
                  ) : (
                    <p className="text-sm text-green-600 mt-2">{t("credit.onTrack")}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default CreditReadiness;
