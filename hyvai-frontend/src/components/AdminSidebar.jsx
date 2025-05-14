import { useState, useEffect } from "react";
import {
  FaChartBar,
  FaUsers,
  FaSignOutAlt,
  FaChartLine,
  FaMoneyCheckAlt,
  FaBell,
  FaUserShield, // icon for Admin Logs
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const AdminSidebar = ({ setSelectedTab }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(sessionStorage.getItem("user"));
    if (user && user.email) {
      setCurrentUserEmail(user.email);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/", { replace: true });
  };

  const menuItems = [
    { icon: <FaChartBar />, label: "Dashboard Insights", tab: "overview" },
    { icon: <FaUsers />, label: "Manage Installments", tab: "manageInstallments" },
    { icon: <FaChartLine />, label: "Score Trends", tab: "scoreTrends" },
    { icon: <FaMoneyCheckAlt />, label: "Performance & Cashflow", tab: "performance" },
    { icon: <FaBell />, label: "Installment Risk Monitor", tab: "riskMonitor" },
    
  ];

  if (currentUserEmail === "destin@gmail.com") {
    menuItems.push(
      {
        icon: <FaUserShield />,
        label: "Admin Logs",
        tab: "adminLogs",
      },
      {
        icon: <FaUsers />,
        label: "User Management",
        tab: "userManagement",
      }
    );
  }
  
  return (
    <>
      {/* 🍔 Mobile Toggle */}
      <button
        className="fixed top-4 left-4 z-50 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-full shadow-lg md:hidden animate-bounce hover:scale-110 transition"
        onClick={() => setIsOpen(true)}
      >
        ☰
      </button>

      {/* 📊 Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-indigo-50 to-white shadow-2xl p-5 z-40 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static`}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-extrabold text-indigo-700 tracking-wide">
            Admin Panel
          </h2>
          <button
            className="text-indigo-500 hover:text-red-500 md:hidden"
            onClick={() => setIsOpen(false)}
          >
            ✕
          </button>
        </div>

        {/* 🧭 Menu List */}
        <ul className="space-y-4 font-semibold text-indigo-900">
          {menuItems.map((item, idx) => (
            <li key={idx}>
              <button
                onClick={() => {
                  setSelectedTab(item.tab);
                  setIsOpen(false);
                }}
                className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gradient-to-r from-indigo-200 to-pink-100 transform hover:scale-105 transition-all duration-200 shadow-sm"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}

          {/* 🔐 Logout */}
          <li>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 text-red-500 hover:text-white hover:bg-red-400 bg-red-100 p-3 w-full rounded-lg transform hover:scale-105 transition-all duration-200 shadow-sm"
            >
              <FaSignOutAlt className="text-lg" />
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </aside>

      {/* 📱 Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default AdminSidebar;
