import { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const Login = () => {
  const { login } = useContext(AuthContext);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem("user"));
    if (storedUser) {
      navigate(storedUser.role === "admin" ? "/admin/dashboard" : "/employee/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userData = await login(formData.email, formData.password);
      setTimeout(() => {
        navigate(userData.user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard", { replace: true });
      }, 200);
    } catch (err) {
      console.error("Login Error:", err);
      setError(t("login.error") || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-xl rounded-lg p-8 max-w-md w-full">
        {/* 🔹 Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Hyvai Logo" className="h-16 object-contain" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-4 text-blue-700">{t("login.welcome")}</h2>

        {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-gray-700 font-medium mb-1">{t("login.email")}</label>
            <input
              type="email"
              name="email"
              placeholder={t("login.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">{t("login.password")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t("login.passwordPlaceholder")}
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border rounded-lg pr-10 focus:outline-none focus:ring focus:border-blue-300"
                required
              />
              <span
                className="absolute top-2 right-3 cursor-pointer text-gray-500"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? t("login.signingIn") : t("login.signIn")}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4 text-sm">
          {t("login.noAccount")}{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            {t("login.register")}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
