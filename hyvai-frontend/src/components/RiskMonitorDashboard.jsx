import { useEffect, useState, useCallback, useMemo } from "react";
import axios from "axios";
import Modal from "react-modal";
import toast, { Toaster } from "react-hot-toast";

Modal.setAppElement('#root');

const RiskMonitorDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [risks, setRisks] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [activeLogInstallment, setActiveLogInstallment] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [currentUser, setCurrentUser] = useState({});
  const [escalationData, setEscalationData] = useState({
    installment_id: null,
    assigned_to: "",
    method: "",
    notes: "",
  });

  const token = sessionStorage.getItem("userToken");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  const API_BASE = "http://13.60.35.161:5000/api/risk";

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/me`, { headers });
      setCurrentUser(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch user", err);
    }
  }, [headers]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await axios.get("http://13.60.35.161:5000/api/admin/companies", { headers });
      setCompanies(res.data);
    } catch (err) {
      console.error("❌ Failed to load companies", err);
    }
  }, [headers]);

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/admins`, { headers });
      setAdmins(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch admins", err);
    }
  }, [headers]);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/overview`, {
        headers,
        params: { company_id: selectedCompany },
      });
      setOverview(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch overview", err);
    }
  }, [headers, selectedCompany]);

  const fetchRisks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/installments`, {
        headers,
        params: { company_id: selectedCompany },
      });
      setRisks(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch risks", err);
    }
  }, [headers, selectedCompany]);

  const fetchTopProducts = useCallback(async () => {
    try {
      const res = await axios.get("http://13.60.35.161:5000/api/recommend/top-products", { headers });
      setTopProducts(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch top products", err);
    }
  }, [headers]);

  const fetchLogs = async (installmentId) => {
    try {
      const res = await axios.get(`${API_BASE}/escalate/${installmentId}`, { headers });
      setLogs(res.data);
      setActiveLogInstallment(installmentId);
      setLogsOpen(true);
    } catch (err) {
      console.error("❌ Failed to fetch logs", err);
    }
  };

  const handleRecommendProduct = async (productId, isCurrentlyRecommended) => {
    try {
      await axios.post("http://13.60.35.161:5000/api/recommend/toggle", {
        productId: productId,
        isRecommended: !isCurrentlyRecommended,
      }, { headers });
  
      toast.success(`✅ Product ${!isCurrentlyRecommended ? "recommended" : "unrecommended"} successfully`);
      fetchTopProducts(); // refresh updated data
    } catch (err) {
      console.error("❌ Failed to update recommendation", err);
      toast.error("Failed to update recommendation");
    }
  };
  
  

  const handleEscalateClick = (id) => {
    setEscalationData({
      installment_id: id,
      assigned_to: "",
      method: "",
      notes: "",
    });
    setModalOpen(true);
  };

  const submitEscalation = async () => {
    try {
      await axios.post(`${API_BASE}/escalate`, escalationData, { headers });
      toast.success("✅ Escalation logged successfully!");
      setModalOpen(false);
      fetchRisks();
    } catch (err) {
      console.error("❌ Escalation submission failed", err);
      toast.error("Failed to escalate. Try again.");
    }
  };

  const getRiskColor = (level) => {
    switch (level) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-gray-200 text-gray-600";
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchCompanies();
    fetchAdmins();
    fetchTopProducts();
  }, [fetchCurrentUser, fetchCompanies, fetchAdmins, fetchTopProducts]);

  useEffect(() => {
    fetchOverview();
    fetchRisks();
  }, [fetchOverview, fetchRisks]);

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" />
      <h2 className="text-3xl font-extrabold text-indigo-700">🚨 Risk Monitor Dashboard</h2>

      {/* Filter */}
      <div className="flex justify-end">
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="border px-3 py-2 rounded shadow-sm text-sm"
        >
          <option value="">All Companies</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Overview */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-indigo-600 text-white p-5 rounded-xl shadow">
            <div className="text-sm">📦 Total Installments</div>
            <div className="text-2xl font-bold">{overview.total}</div>
          </div>
          <div className="bg-red-500 text-white p-5 rounded-xl shadow">
            <div className="text-sm">❌ Missed Payments</div>
            <div className="text-2xl font-bold">{overview.risky_count}</div>
          </div>
          <div className="bg-yellow-500 text-white p-5 rounded-xl shadow">
            <div className="text-sm">⏳ Due Soon</div>
            <div className="text-2xl font-bold">{overview.upcoming_dues}</div>
          </div>
        </div>
      )}

      {/* Risk Table */}
      <div className="bg-white rounded-xl shadow mt-6 overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
            <tr>
              <th className="p-3">👤 Employee</th>
              <th className="p-3">📞 Phone</th>
              <th className="p-3">🏢 Company</th>
              <th className="p-3 text-center">❌ Missed</th>
              <th className="p-3 text-center">📅 Days</th>
              <th className="p-3 text-center">🧠 Risk</th>
              <th className="p-3 text-center">⚙️ Action</th>
            </tr>
          </thead>
          <tbody>
            {risks.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{r.user_name}</td>
                <td className="p-3 text-blue-600">{r.phone}</td>
                <td className="p-3">{r.company_name}</td>
                <td className="p-3 text-center text-red-600 font-bold">{r.missed_count}</td>
                <td className="p-3 text-center">{r.days_since_upfront} days</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskColor(r.risk_level)}`}>
                    {r.risk_level}
                  </span>
                </td>
                <td className="p-3 flex gap-2 justify-center">
                  <button
                    onClick={() => handleEscalateClick(r.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                  >
                    Escalate
                  </button>
                  <button
                    onClick={() => fetchLogs(r.id)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-3 py-1 rounded text-xs"
                  >
                    Logs
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Recommendations */}
      <div className="bg-white rounded-xl shadow p-5 mt-6">
        <h3 className="text-lg font-semibold text-indigo-700 mb-4">🔥 Most Popular Installment Products</h3>
        {topProducts.length === 0 ? (
          <p className="text-gray-500 text-sm">No data yet.</p>
        ) : (
          <ul className="divide-y">
            {topProducts.map((p, index) => (
              <li key={p.id} className="py-3 text-sm flex justify-between items-start gap-4">
                <div>
                  <div className="font-medium text-gray-800">
                    {index + 1}. {p.name}
                    <span className="text-gray-400 text-xs ml-1">({p.category})</span>
                    {p.is_recommended && (
                      <span className="ml-2 text-green-600 text-xs font-bold">[Recommended]</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 space-y-1">
                    <div>🧠 Avg Risk Score: <strong>{p.avg_risk_score ?? 'N/A'}</strong></div>
                    <div>🏢 Ordered by: {p.companies?.length > 0
                      ? p.companies.map(c => `${c.name} (${c.count})`).join(', ')
                      : "N/A"}
                    </div>
                    <div>📦 Stock: {p.stock > 0
                      ? <span className="text-green-600 font-semibold">In Stock ({p.stock})</span>
                      : <span className="text-red-600 font-semibold">Out of Stock</span>}
                    </div>
                    <div>📊 Trend: {p.trend > 0
                      ? <span className="text-green-600">📈 +{p.trend}%</span>
                      : p.trend < 0
                        ? <span className="text-red-600">📉 {p.trend}%</span>
                        : <span className="text-gray-600">—</span>}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded text-xs">
                    {p.order_count} orders
                  </span>
                  <button
  className={`text-xs px-3 py-1 rounded ${
    p.is_recommended
      ? "bg-red-100 text-red-700 hover:bg-red-200"
      : "bg-green-100 text-green-700 hover:bg-green-200"
  }`}
  onClick={() => handleRecommendProduct(p.id, p.is_recommended)}
>
  {p.is_recommended ? "Unrecommend" : "Recommend"}
</button>

                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Escalation Modal */}
      <Modal
        isOpen={modalOpen}
        onRequestClose={() => setModalOpen(false)}
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg mx-auto mt-20 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center"
      >
        <h2 className="text-xl font-bold text-indigo-700 mb-4">🚀 Escalate Installment</h2>
        <div className="space-y-4">
          {currentUser?.email === "destin@gmail.com" && (
            <div>
              <label className="block text-sm font-semibold mb-1">Assign To</label>
              <select
                value={escalationData.assigned_to}
                onChange={(e) => setEscalationData(prev => ({ ...prev, assigned_to: e.target.value }))}
                className="border w-full px-3 py-2 rounded"
              >
                <option value="">-- Select Admin --</option>
                {admins.map((a) => (
                  <option key={a.id} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1">Method</label>
            <select
              value={escalationData.method}
              onChange={(e) => setEscalationData(prev => ({ ...prev, method: e.target.value }))}
              className="border w-full px-3 py-2 rounded"
            >
              <option value="">-- Select Method --</option>
              <option value="call">Call</option>
              <option value="visit">Visit</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Notes</label>
            <textarea
              value={escalationData.notes}
              onChange={(e) => setEscalationData(prev => ({ ...prev, notes: e.target.value }))}
              className="border w-full px-3 py-2 rounded"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setModalOpen(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button
              onClick={submitEscalation}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
            >
              Submit
            </button>
          </div>
        </div>
      </Modal>

      {/* Logs Modal */}
      <Modal
        isOpen={logsOpen}
        onRequestClose={() => setLogsOpen(false)}
        className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl mx-auto mt-20 outline-none"
        overlayClassName="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
      >
        <h2 className="text-xl font-bold text-indigo-700 mb-4">
          📚 Escalation Logs (#{activeLogInstallment})
        </h2>
        {logs.length === 0 ? (
          <p className="text-gray-500">No escalations found for this installment.</p>
        ) : (
          <ul className="space-y-4">
            {logs.map((log) => (
              <li key={log.id} className="border-b pb-3 text-sm">
                <p><strong>Assigned To:</strong> {log.assigned_to}</p>
                <p><strong>Method:</strong> {log.method}</p>
                <p><strong>Notes:</strong> {log.notes}</p>
                <p className="text-xs text-gray-500"><strong>Created:</strong> {new Date(log.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
};

export default RiskMonitorDashboard;
