import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CSVLink } from "react-csv";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const AdminPerformanceDashboard = () => {
  const [companies, setCompanies] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const csvLinkRef = useRef();

  const fetchData = async () => {
    try {
      const token = sessionStorage.getItem("userToken");

      const companyQuery = selectedCompany ? `company_id=${selectedCompany}` : "";
      const dateQuery = startDate && endDate ? `&start_date=${startDate}&end_date=${endDate}` : "";

      const analyticsRes = await axios.get(
        `http://13.60.35.161:5000/api/admin/analytics?${companyQuery}${dateQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAnalytics(analyticsRes.data || []);

      const employeesRes = await axios.get(
        `http://13.60.35.161:5000/api/admin/analytics/employees?${companyQuery}${dateQuery}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEmployees(employeesRes.data || []);

      if (companies.length === 0) {
        const companyRes = await axios.get(
          "http://13.60.35.161:5000/api/admin/companies",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setCompanies(companyRes.data || []);
      }
    } catch (err) {
      console.error("❌ Error loading analytics:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany, startDate, endDate]);

  const total = (field) =>
    employees.reduce((sum, e) => sum + (parseFloat(e[field]) || 0), 0);

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
  
    const companyName = companies.find(c => c.id === parseInt(selectedCompany))?.name || "All Companies";
    const period = startDate && endDate ? `${startDate} → ${endDate}` : "Full History";
  
    doc.setFontSize(18);
    doc.text("💼 Performance & Cashflow Report", 14, 20);
  
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(`Company: ${companyName}`, 14, 30);
    doc.text(`Date Range: ${period}`, 14, 37);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 44);
  
    autoTable(doc, {
      startY: 50,
      head: [["Employee", "Upfront", "Second", "Third", "Total"]],
      body: employees.map((e) => [
        e.name,
        (parseFloat(e.upfront) || 0).toFixed(2),
        (parseFloat(e.second) || 0).toFixed(2),
        (parseFloat(e.third) || 0).toFixed(2),
        (
          (parseFloat(e.upfront) || 0) +
          (parseFloat(e.second) || 0) +
          (parseFloat(e.third) || 0)
        ).toFixed(2),
      ]),
      styles: {
        fontSize: 10,
      },
      headStyles: {
        fillColor: [79, 70, 229], // Indigo
        textColor: [255, 255, 255],
        halign: "center"
      },
      theme: "grid",
      margin: { top: 50 },
    });
  
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Admin Signature: ___________________________", 14, doc.internal.pageSize.height - 20);
  
    doc.save("performance_report.pdf");
  };
  

  const barChartData = {
    labels: employees.map((e) => e.name),
    datasets: [
      {
        label: "Upfront",
        backgroundColor: "#4f46e5",
        data: employees.map((e) => parseFloat(e.upfront) || 0),
      },
      {
        label: "Second",
        backgroundColor: "#10b981",
        data: employees.map((e) => parseFloat(e.second) || 0),
      },
      {
        label: "Third",
        backgroundColor: "#f59e0b",
        data: employees.map((e) => parseFloat(e.third) || 0),
      },
    ],
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-indigo-700">📊 Performance & Cashflow Analytics</h2>

        <div className="flex gap-2">
          <button
            onClick={() => csvLinkRef.current.link.click()}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded shadow text-sm"
          >
            📥 Export CSV
          </button>
          <button
            onClick={handleDownloadPDF}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow text-sm"
          >
            🧾 Export PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-gray-700 font-semibold text-sm">Filter Company:</label>
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="border px-3 py-2 rounded text-sm shadow-sm w-48"
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-gray-700 font-semibold text-sm">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border px-3 py-2 rounded text-sm shadow-sm"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-gray-700 font-semibold text-sm">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border px-3 py-2 rounded text-sm shadow-sm"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 text-center">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-xs text-gray-500">💰 Upfront Paid</div>
          <div className="text-xl font-bold text-indigo-600">${total("upfront").toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-xs text-gray-500">💸 Second Paid</div>
          <div className="text-xl font-bold text-emerald-600">${total("second").toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-xs text-gray-500">💳 Third Paid</div>
          <div className="text-xl font-bold text-yellow-600">${total("third").toFixed(2)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <div className="text-xs text-gray-500">🧮 Total Cashflow</div>
          <div className="text-xl font-bold text-purple-700">
            ${(total("upfront") + total("second") + total("third")).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto mt-6">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-indigo-50 uppercase text-xs text-indigo-800">
            <tr>
              <th className="p-3 text-left">Employee</th>
              <th className="p-3">Upfront</th>
              <th className="p-3">Second</th>
              <th className="p-3">Third</th>
              <th className="p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.user_id} className="border-b hover:bg-gray-50">
                <td className="p-3">{e.name}</td>
                <td className="p-3">${(parseFloat(e.upfront) || 0).toFixed(2)}</td>
                <td className="p-3">${(parseFloat(e.second) || 0).toFixed(2)}</td>
                <td className="p-3">${(parseFloat(e.third) || 0).toFixed(2)}</td>
                <td className="p-3">
                  ${(parseFloat(e.upfront || 0) + parseFloat(e.second || 0) + parseFloat(e.third || 0)).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bar Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6">
        <h3 className="text-lg font-bold mb-4 text-indigo-700">📊 Employee Payment Distribution</h3>
        <Bar data={barChartData} options={{ responsive: true, plugins: { legend: { position: "top" } } }} />
      </div>

      {/* Hidden CSV Download Link */}
      <CSVLink
        data={employees.map((e) => ({
          Employee: e.name,
          Upfront: (parseFloat(e.upfront) || 0).toFixed(2),
          Second: (parseFloat(e.second) || 0).toFixed(2),
          Third: (parseFloat(e.third) || 0).toFixed(2),
          Total: ((parseFloat(e.upfront) || 0) + (parseFloat(e.second) || 0) + (parseFloat(e.third) || 0)).toFixed(2),
        }))}
        filename="performance_report.csv"
        ref={csvLinkRef}
        className="hidden"
        target="_blank"
      >
        Download CSV
      </CSVLink>
    </div>
  );
};

export default AdminPerformanceDashboard;
