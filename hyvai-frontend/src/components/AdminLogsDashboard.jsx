import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const AdminLogsDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const token = sessionStorage.getItem("userToken");
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const fetchLogs = async () => {
    try {
      const params = {};
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }

      const res = await axios.get("http://localhost:5000/api/admin/logs", {
        headers,
        params,
      });
      setLogs(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setAccessDenied(true);
      } else {
        console.error("❌ Failed to fetch admin logs", err);
        toast.error("Unable to load admin logs.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchLogs();
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">⏳ Loading admin logs...</div>;
  }

  if (accessDenied) {
    return (
      <div className="p-6 text-red-500 font-semibold text-sm">
        ❌ Access Denied: You are not authorized to view admin logs.
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-indigo-700">📜 Admin Activity Logs</h2>

      {/* 📅 Date Range Filter */}
      <form onSubmit={handleFilterSubmit} className="flex gap-4 items-end mb-4">
        <div>
          <label className="block text-xs text-gray-600 font-semibold mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-3 py-2 rounded shadow-sm text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-600 font-semibold mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-3 py-2 rounded shadow-sm text-sm"
            required
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-sm"
        >
          Filter
        </button>
      </form>

      {logs.length === 0 ? (
        <div className="text-gray-500">No admin actions found for the selected period.</div>
      ) : (
        <div className="overflow-auto bg-white rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
              <tr>
                <th className="p-3">👤 Admin</th>
                <th className="p-3">✉️ Email</th>
                <th className="p-3">🛠️ Action</th>
                <th className="p-3">📦 Module</th>
                <th className="p-3">📝 Description</th>
                <th className="p-3">⏰ Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">{log.admin_name}</td>
                  <td className="p-3 text-xs text-blue-600">{log.email}</td>
                  <td className="p-3 font-semibold text-green-700">{log.action}</td>
                  <td className="p-3">{log.module}</td>
                  <td className="p-3 text-gray-700">{log.description}</td>
                  <td className="p-3 text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminLogsDashboard;
