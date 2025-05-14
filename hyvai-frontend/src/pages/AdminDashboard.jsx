import { useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminManageInstallments from "../components/AdminManageInstallments";
import AdminOverviewDashboard from "../components/AdminOverviewDashboard"; // ✅ Import Overview Component
import AdminMLDataset from "../components/AdminMLDataset"; 
import AdminPerformanceDashboard from "../components/AdminPerformanceDashboard";// ✅ New component injected
import RiskMonitorDashboard from "../components/RiskMonitorDashboard";
import AdminLogsDashboard from "../components/AdminLogsDashboard";
import AdminUserManagement from "../components/AdminUserManagement";





// Future phases to import and plug in here:
// import AdminScoreTrends from "../components/AdminScoreTrends";
// import AdminExportReports from "../components/AdminExportReports";
// import AdminReminderSettings from "../components/AdminReminderSettings";

const AdminDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("manageInstallments");

  const renderContent = () => {
    switch (selectedTab) {
      case "overview":
        return <AdminOverviewDashboard />; // ✅ Embed real component

      case "manageInstallments":
        return <AdminManageInstallments />;

        case "scoreTrends":
          return <AdminMLDataset />; // ⬅️ ML Phase 2 Plugged Here

          case "performance":
            return <AdminPerformanceDashboard />; // coming next

            case "riskMonitor":
              return <RiskMonitorDashboard />; // ✅ Plugged Risk Monitor 

              case "adminLogs":
              return <AdminLogsDashboard />; // ✅adminLogs 

              case "userManagement":
              return <AdminUserManagement />;
      default:
        return (
          <div className="p-6">
            ⚙️ Admin Dashboard Home - Please select a tab.
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 🧭 Sidebar Navigation */}
      <AdminSidebar setSelectedTab={setSelectedTab} />

      {/* 🧾 Tab Content */}
      <main className="flex-1 px-6 py-4">{renderContent()}</main>
    </div>
  );
};

export default AdminDashboard;
