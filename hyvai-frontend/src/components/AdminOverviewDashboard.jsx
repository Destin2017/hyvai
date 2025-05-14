import { useEffect, useState } from "react";
import axios from "axios";

const AdminOverviewDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const API = "http://localhost:5000/api/admin/dashboard-insights";

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await axios.get(API, {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem("userToken")}`,
          },
        });
        setData(res.data);
      } catch (err) {
        console.error("❌ Failed to load dashboard insights:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) return <div className="p-6 animate-pulse text-blue-700">⏳ Loading insights...</div>;
  if (!data) return <div className="p-6 text-red-600">⚠️ Could not load insights.</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h2 className="text-4xl font-extrabold text-blue-900 mb-4 tracking-tight">
        📊 Admin Overview Dashboard
      </h2>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Average Score Card */}
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-xl transition">
          <h3 className="text-lg font-bold text-gray-700 mb-2">📈 Average Score</h3>
          <p className="text-5xl font-bold text-blue-600">{data.scoreStats?.avg_score}</p>
          <p className="text-sm text-gray-500 mt-1">
            Employees: {data.scoreStats?.total_employees} • Min: {data.scoreStats?.min_score} • Max: {data.scoreStats?.max_score}
          </p>
        </div>

        {/* Installment Summary */}
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-xl transition">
          <h3 className="text-lg font-bold text-gray-700 mb-2">📋 Installment Summary</h3>
          <ul className="space-y-1 text-gray-700 text-sm">
            <li>✅ <strong>Approved:</strong> {data.installmentStats.approved}</li>
            <li>❌ <strong>Rejected:</strong> {data.installmentStats.rejected}</li>
            <li>💰 <strong>Upfront Paid:</strong> {data.installmentStats.upfront_paid}</li>
            <li>⚠️ <strong>Missed Payments:</strong> {data.installmentStats.missed_payments}</li>
          </ul>
        </div>

        {/* Top Performers */}
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-xl transition">
          <h3 className="text-lg font-bold text-green-700 mb-2">🥇 Top Performers</h3>
          {data.topPerformers?.length > 0 ? (
            <ul className="space-y-1 text-gray-700 text-sm">
              {data.topPerformers.map((user, idx) => (
                <li key={idx}>✅ {user.name} — <span className="text-green-600 font-semibold">{user.latest_score} pts</span></li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No top performers yet.</p>
          )}
        </div>

        {/* Risky Users */}
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-xl transition">
          <h3 className="text-lg font-bold text-red-700 mb-2">🚨 Risky Employees</h3>
          {data.riskyUsers?.length > 0 ? (
            <ul className="space-y-1 text-gray-700 text-sm">
              {data.riskyUsers.map((user, idx) => (
                <li key={idx}>⚠️ {user.name} — <span className="text-red-600 font-semibold">{user.latest_score} pts</span></li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No risky users at the moment.</p>
          )}
        </div>

        {/* Discount Eligible */}
        <div className="bg-white p-6 rounded-xl shadow hover:shadow-xl transition">
          <h3 className="text-lg font-bold text-yellow-700 mb-2">🏅 Discount Eligible</h3>
          {data.discountEligible?.length > 0 ? (
            <ul className="space-y-1 text-gray-700 text-sm">
              {data.discountEligible.map((user, idx) => (
                <li key={idx}>💸 {user.name} — <span className="text-yellow-600 font-semibold">{user.latest_score} pts</span></li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400">No discount-eligible users currently.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewDashboard;
