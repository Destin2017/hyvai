import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProductsPage from "./pages/ProductsPage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import ProductDetailPage from "./pages/ProductDetailPage";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import LanguageSwitcher from "./components/LanguageSwitcher"; // 🆕 Floating language button

function App() {
  return (
    <Router>
      <div className="relative min-h-screen">
        <Routes>
          <Route path="/" element={<ProductsPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/employee/dashboard" element={<EmployeeDashboard />} />
          <Route
            path="*"
            element={
              <h1 className="text-center text-red-500">404 - Page Not Found</h1>
            }
          />
        </Routes>

        {/* 🌍 Floating language switcher */}
        <LanguageSwitcher />
      </div>
    </Router>
  );
}

export default App;
