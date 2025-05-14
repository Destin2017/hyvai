import { useEffect, useState } from "react";
import axios from "axios";
import Spinner from "./Spinner";
import { Line, Bar, Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import confetti from "canvas-confetti"; // 🎊 Confetti added here

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Filler
);

const AdminMLDataset = () => {
  const [mlData, setMLData] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [loading, setLoading] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [showPredictionsModal, setShowPredictionsModal] = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const DATA_API = "http://localhost:5000/api/ml/dataset";
  const COMP_API = "http://localhost:5000/api/admin/companies";
  const PREDICT_API = "http://localhost:8000/predict-risk";

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [mlRes, compRes] = await Promise.all([
          axios.get(DATA_API, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("userToken")}` },
          }),
          axios.get(COMP_API, {
            headers: { Authorization: `Bearer ${sessionStorage.getItem("userToken")}` },
          }),
        ]);
        setMLData(mlRes.data || []);
        setCompanies(compRes.data || []);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const filtered = mlData.filter(
    (u) =>
      u.role !== "admin" &&
      (selectedCompany === "all" || u.company_id === parseInt(selectedCompany))
  );

  const format = (val) => (val === null || val === undefined ? "—" : val);

  const getRiskClass = (risk) => {
    if (risk === "high") return "bg-red-100 text-red-700";
    if (risk === "medium") return "bg-yellow-100 text-yellow-800";
    if (risk === "low") return "bg-green-100 text-green-700";
    return "bg-gray-100 text-gray-500";
  };

  const getNameById = (id) => {
    const match = mlData.find((u) => u.user_id === id);
    return match ? match.name : `User #${id}`;
  };

  const scoreThreshold = 60;
  const volatilityThreshold = 15;

  const handleRunPredictions = async () => {
    try {
      setPredicting(true);
      const res = await axios.post(
        PREDICT_API,
        { users: filtered },
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
          },
        }
      );

      const enriched = res.data.predictions;
      setPredictions(enriched);
      setShowPredictionsModal(true);

      const updated = mlData.map((user) => {
        const match = enriched.find((e) => e.user_id === user.user_id);
        return match ? { ...user, ...match } : user;
      });
      setMLData(updated);

      setShowSuccessMessage(true);

      // 🎊 Confetti celebration after success
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
      });

      setTimeout(() => setShowSuccessMessage(false), 3000);
    } catch (err) {
      console.error("❌ Prediction error:", err);
    } finally {
      setPredicting(false);
    }
  };

  const scatterPoints = filtered.map((u) => ({
    x: u.avg_score || 0,
    y: u.score_stddev || 0,
    user: u,
  }));

  const lineData = {
    labels: filtered.map((u) => u.name),
    datasets: [
      {
        label: "Score Volatility",
        data: filtered.map((u) => u.score_stddev || 0),
        borderColor: "rgba(99, 102, 241, 0.8)",
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const barData = {
    labels: filtered.map((u) => u.name),
    datasets: [
      {
        label: "On-Time Payments",
        data: filtered.map((u) => u.ontime_payments || 0),
        backgroundColor: "rgba(34, 197, 94, 0.6)",
      },
      {
        label: "Missed Payments",
        data: filtered.map((u) => u.missed_payments || 0),
        backgroundColor: "rgba(239, 68, 68, 0.6)",
      },
    ],
  };

  const scatterData = {
    datasets: [
      {
        label: "Score vs Volatility",
        data: scatterPoints,
        backgroundColor: "rgba(234, 88, 12, 0.6)",
        pointRadius: 5,
      },
      {
        label: "Score Threshold",
        data: Array(100).fill().map((_, i) => ({ x: scoreThreshold, y: i })),
        showLine: true,
        borderColor: "green",
        borderDash: [6, 6],
        pointRadius: 0,
      },
      {
        label: "Volatility Threshold",
        data: Array(100).fill().map((_, i) => ({ x: i, y: volatilityThreshold })),
        showLine: true,
        borderColor: "red",
        borderDash: [6, 6],
        pointRadius: 0,
      },
    ],
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-6 space-y-10 relative">
      {showSuccessMessage && (
        <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded shadow-lg animate-bounce z-50">
          🎯 Predictions Complete! Check the risks.
        </div>
      )}

      {/* 🔮 Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-fuchsia-700">🧠 Predictive Scoring Dataset</h2>
        <button
          onClick={handleRunPredictions}
          disabled={predicting}
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:scale-105 transform transition-all duration-200 text-white px-4 py-2 rounded shadow-md text-sm"
        >
          {predicting ? "Running..." : "Run Predictions 🚀"}
        </button>
      </div>

      {/* 🎯 Filter */}
      <div className="mb-4 flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Filter by Company:</label>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="all">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* 📊 Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-100 text-blue-800 uppercase text-xs">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Company</th>
              <th className="p-3">Risk</th>
              <th className="p-3">Scores</th>
              <th className="p-3">Volatility</th>
              <th className="p-3">Prediction</th>
              <th className="p-3">On-Time</th>
              <th className="p-3">Missed</th>
              <th className="p-3">History</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50 transition duration-100">
                <td className="p-3 font-medium text-gray-800">{user.name}</td>
                <td className="p-3 text-gray-600">{format(user.company_name)}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskClass(user.risk_category)}`}>
                    {format(user.risk_category)}
                  </span>
                </td>
                <td className="p-3">{format(user.avg_score)}</td>
                <td className="p-3">{format(user.score_stddev)}</td>
                <td className="p-3">
                  {user.predicted_risk ? (
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      user.predicted_risk === "high" ? "bg-red-200 text-red-800" :
                      user.predicted_risk === "low" ? "bg-green-200 text-green-800" :
                      "bg-yellow-200 text-yellow-800"
                    }`}>
                      {user.predicted_risk} ({typeof user.confidence === "number" ? `${(user.confidence * 100).toFixed(2)}%` : "0.00%"})
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="p-3">{format(user.ontime_payments)}</td>
                <td className="p-3">{format(user.missed_payments)}</td>
                <td className="p-3">{format(user.span_days)} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📈 Line Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-indigo-600 mb-2">📈 Score Volatility</h3>
        <Line data={lineData} />
      </div>

      {/* 📊 Bar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-emerald-600 mb-2">📊 On-Time vs Missed Payments</h3>
        <Bar data={barData} />
      </div>

      {/* 🔮 Scatter Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-purple-600 mb-2">🔮 Risk Clustering</h3>
        <Scatter
          data={scatterData}
          options={{
            plugins: {
              legend: { position: "top", labels: { usePointStyle: true } },
              tooltip: {
                callbacks: {
                  label: (ctx) => `📈 Score: ${ctx.raw.x}, 📉 Volatility: ${ctx.raw.y}`,
                },
              },
            },
            scales: {
              x: { title: { display: true, text: "Average Score" } },
              y: { title: { display: true, text: "Volatility (Std Dev)" } },
            },
          }}
        />
      </div>

      {/* 🔮 Prediction Modal */}
      {showPredictionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full space-y-4 animate-fadeIn">
            <h2 className="text-2xl font-bold text-indigo-700">🔮 Prediction Results</h2>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {predictions.map((p, idx) => (
                <li key={idx} className="flex justify-between text-sm border-b pb-1">
                  <span className="font-semibold">{getNameById(p.user_id)}</span>
                  <span className={`px-2 py-1 rounded-full ${
                    p.predicted_risk === "high" ? "bg-red-200 text-red-800" :
                    p.predicted_risk === "low" ? "bg-green-200 text-green-800" :
                    "bg-yellow-200 text-yellow-800"
                  }`}>
                    {p.predicted_risk.toUpperCase()} ({typeof p.confidence === "number" ? `${(p.confidence * 100).toFixed(2)}%` : "0.00%"})
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setShowPredictionsModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-sm px-4 py-2 rounded w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMLDataset;
