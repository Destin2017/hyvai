import { useEffect, useState } from "react";
import axios from "axios";
import confetti from "canvas-confetti";

const AdminManageInstallments = () => {
  const [installments, setInstallments] = useState([]);
  const [edited, setEdited] = useState({});
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [saveSuccess, setSaveSuccess] = useState({});
  const [saveCounter, setSaveCounter] = useState(0);
  const [viewMode, setViewMode] = useState("ongoing");
  const [refreshKey, setRefreshKey] = useState(0);

  const API = "http://13.60.35.161:5000/api/admin/installments";
  const COMPANY_API = "http://13.60.35.161:5000/api/admin/companies";

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchInstallments();
  }, [refreshKey]);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get(COMPANY_API, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("userToken")}` },
      });
      setCompanies(res.data);
    } catch (err) {
      console.error("❌ Error fetching companies:", err);
    }
  };

  const fetchInstallments = async () => {
    try {
      const res = await axios.get(API, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("userToken")}` },
      });
      setInstallments(res.data);
    } catch (err) {
      console.error("❌ Error fetching installments:", err);
    }
  };

  const handleEdit = (id, field, value) => {
    setEdited((prev) => {
      const currentEdit = { ...prev[id], [field]: value };

      // Reset logic for rejected status
      if (field === "status" && value === "rejected") {
        currentEdit.upfront_payment_status = "pending";
        currentEdit.second_payment_status = "due";
        currentEdit.third_payment_status = "due";
      }

      return {
        ...prev,
        [id]: currentEdit,
      };
    });
  };

  const handleSave = async (id) => {
    try {
      const payload = edited[id];
      if (!payload) return;

      await axios.put(`${API}/${id}`, payload, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("userToken")}` },
      });

      setEdited((prev) => {
        const newState = { ...prev };
        delete newState[id];
        return newState;
      });

      setSaveSuccess((prev) => ({ ...prev, [id]: true }));
      setSaveCounter((prev) => prev + 1);
      setRefreshKey((prev) => prev + 1);

      setTimeout(() => {
        setSaveSuccess((prev) => ({ ...prev, [id]: false }));
      }, 2000);

      if ((saveCounter + 1) % 3 === 0) {
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error("❌ Failed to save:", err);
    }
  };

  const getFormattedDate = (dateStr, offsetDays = 0) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    date.setDate(date.getDate() + offsetDays);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString(undefined, options);
  };

  const getBadgeClass = (val) => {
    if (val === "paid") return "bg-green-100 text-green-800";
    if (val === "missed") return "bg-red-100 text-red-700";
    if (val === "due") return "bg-yellow-100 text-yellow-800";
    return "bg-gray-200 text-gray-600";
  };

  const getOptions = (field, currentValue) => {
    if (["upfront_payment_status", "second_payment_status", "third_payment_status"].includes(field)) {
      return ["pending", "paid", "missed", "due"].filter((v, i, a) => a.indexOf(v) === i);
    }
    if (field === "status") {
      return ["approved", "rejected"].filter((v, i, a) => a.indexOf(v) === i);
    }
    return [];
  };

  const filteredInstallments = installments.filter((i) => {
    const companyMatch = selectedCompany ? i.company_id === parseInt(selectedCompany) : true;
    const viewMatch = viewMode === "ongoing"
      ? ["approved", "pending", "rejected"].includes(i.status)
      : i.status === "completed";
    return companyMatch && viewMatch;
  });

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-extrabold text-indigo-700 tracking-tight">📋 Installment Manager</h2>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <label className="text-sm font-semibold mr-2 text-gray-700">Filter by Company:</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="border px-3 py-2 rounded text-sm shadow-sm"
          >
            <option value="">-- All Companies --</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* View Switcher */}
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setViewMode("ongoing")}
            className={`px-4 py-2 rounded-full text-sm font-semibold shadow ${viewMode === "ongoing" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            🚀 Ongoing
          </button>
          <button
            onClick={() => setViewMode("completed")}
            className={`px-4 py-2 rounded-full text-sm font-semibold shadow ${viewMode === "completed" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-700"}`}
          >
            🎯 Completed
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-6 flex-wrap items-center text-sm font-semibold text-gray-600">
        <div>🚀 {installments.filter(i => ["approved", "pending", "rejected"].includes(i.status) && (!selectedCompany || i.company_id === parseInt(selectedCompany))).length} Ongoing</div>
        <div>🎯 {installments.filter(i => i.status === "completed" && (!selectedCompany || i.company_id === parseInt(selectedCompany))).length} Completed</div>
        <div>❌ {installments.filter(i => i.status === "rejected" && (!selectedCompany || i.company_id === parseInt(selectedCompany))).length} Rejected</div>
      </div>

      {/* Table */}
      {filteredInstallments.length === 0 ? (
        <p className="text-gray-500 mt-4">No records found for this view.</p>
      ) : (
        <div className="overflow-auto bg-white rounded-xl shadow-lg mt-4">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-gradient-to-r from-indigo-50 to-purple-100 text-indigo-700 uppercase text-xs">
              <tr>
                <th className="p-3">👤 Employee</th>
                <th className="p-3">📦 Product</th>
                <th className="p-3">📌 Status</th>
                <th className="p-3">💰 Upfront</th>
                <th className="p-3">💸 Second</th>
                <th className="p-3">💳 Third</th>
                <th className="p-3">📅 Dates</th>
                <th className="p-3 text-center">💾 Save</th>
              </tr>
            </thead>
            <tbody>
              {filteredInstallments.map((inst) => {
                const changes = edited[inst.id] || {};
                const current = { ...inst, ...changes };

                const isRejected = current.status === "rejected";
                const isApproved = current.status === "approved";

                return (
                  <tr key={inst.id} className="border-b hover:bg-gray-50 transition">
                    <td className="p-3 font-medium text-gray-800">{inst.user_name}</td>
                    <td className="p-3">{inst.product_name}</td>

                    {/* Status Dropdown */}
                    <td className="p-3">
                      <select
                        value={current.status}
                        onChange={(e) => handleEdit(inst.id, "status", e.target.value)}
                        className="border rounded px-2 py-1 w-full bg-white"
                      >
                        {getOptions("status", current.status).map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </td>

                    {/* Payment Dropdowns */}
                    {["upfront_payment_status", "second_payment_status", "third_payment_status"].map((field) => (
                      <td key={field} className="p-3">
                        <select
                          value={current[field]}
                          onChange={(e) => handleEdit(inst.id, field, e.target.value)}
                          className={`border rounded px-2 py-1 w-full ${getBadgeClass(current[field])}`}
                          disabled={!isApproved}
                        >
                          {getOptions(field, current[field]).map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                    ))}

                    <td className="p-3 text-xs text-gray-600">
                      {inst.upfront_payment_date && (
                        <div className="flex flex-col gap-1">
                          <span>2nd: <span className="font-semibold text-indigo-600">{getFormattedDate(inst.upfront_payment_date, 30)}</span></span>
                          <span>3rd: <span className="font-semibold text-purple-600">{getFormattedDate(inst.upfront_payment_date, 60)}</span></span>
                        </div>
                      )}
                    </td>

                    {/* Save button */}
                    <td className="p-3 text-center">
                      {edited[inst.id] ? (
                        <button
                          onClick={() => handleSave(inst.id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1 rounded text-xs shadow-md transition transform hover:scale-110"
                        >
                          Save
                        </button>
                      ) : saveSuccess[inst.id] ? (
                        <span className="text-green-500 text-lg animate-bounce">✓</span>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminManageInstallments;
