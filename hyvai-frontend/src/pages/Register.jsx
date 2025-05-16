import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const Register = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    company_id: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get("http://13.60.35.161:5000/api/auth/companies");
        setCompanies(response.data);
      } catch (error) {
        console.error("❌ Error fetching companies:", error);
        setError(t("register.errorFetchingCompanies"));
      }
    };
    fetchCompanies();
  }, [t]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCompanyChange = (e) => {
    setFormData({ ...formData, company_id: parseInt(e.target.value, 10) || "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { fullName, email, phone, password, confirmPassword, company_id } = formData;

    if (!fullName || !email || !phone || !password || !confirmPassword || !company_id) {
      setError(t("register.requiredFields"));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t("register.passwordTooShort"));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t("register.passwordMismatch"));
      setLoading(false);
      return;
    }

    try {
      const requestData = {
        name: fullName,
        email,
        phone,
        password,
        company_id
      };

      const response = await axios.post("http://13.60.35.161:5000/api/auth/register", requestData);
      alert(response.data.message);
      navigate("/login");
    } catch (err) {
      console.error("❌ Registration Error:", err.response?.data);
      setError(err.response?.data?.message || t("register.unknownError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
        {/* 🖼️ Logo */}
        <div className="flex justify-center mb-4">
          <img src="/logo.png" alt="Hyvai Logo" className="h-16 object-contain" />
        </div>

        <h2 className="text-2xl font-bold text-center mb-4 text-blue-700">{t("register.title")}</h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700">{t("register.fullName")}</label>
            <input
              type="text"
              name="fullName"
              placeholder={t("register.fullNamePlaceholder")}
              value={formData.fullName}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700">{t("register.email")}</label>
            <input
              type="email"
              name="email"
              placeholder={t("register.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700">{t("register.phone")}</label>
            <input
              type="tel"
              name="phone"
              placeholder={t("register.phonePlaceholder")}
              value={formData.phone}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div className="relative">
            <label className="block text-gray-700">{t("register.password")}</label>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder={t("register.passwordPlaceholder")}
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg pr-10"
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-9 text-gray-500 cursor-pointer"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="relative">
            <label className="block text-gray-700">{t("register.confirmPassword")}</label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder={t("register.confirmPasswordPlaceholder")}
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full p-2 border rounded-lg pr-10"
              required
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-9 text-gray-500 cursor-pointer"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div>
            <label className="block text-gray-700">{t("register.selectCompany")}</label>
            <select
              name="company_id"
              value={formData.company_id}
              onChange={handleCompanyChange}
              className="w-full p-2 border rounded-lg"
              required
            >
              <option value="">{t("register.selectCompany")}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
          >
            {loading ? t("register.loading") : t("register.submit")}
          </button>
        </form>

        <p className="mt-4 text-center text-gray-600">
          {t("register.haveAccount")}{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            {t("register.loginLink")}
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
