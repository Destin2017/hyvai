import { useState, useEffect } from "react";
import axios from "axios";
import Modal from "../components/Modal";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaUserCircle, FaSearch, FaChevronUp, FaArrowLeft } from "react-icons/fa";
import { useTranslation } from "react-i18next"; // 🈶️ added

const ProductDetailPage = () => {
  const { t } = useTranslation(); // 🈳 hook
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [showPhotoIndex, setShowPhotoIndex] = useState(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://13.60.35.161:5000/api/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error("Error fetching product:", error);
        setErrorMessage(t("fetchError"));
      }
    };
    fetchProduct();
  }, [id, t]);

  if (!product) {
    return <p className="text-center text-gray-600 mt-10">{errorMessage || t("loading")}</p>;
  }

  const images = product.image ? product.image.split(",") : ["/placeholder.png"];

  const handleApplyForInstallment = async () => {
    const token = sessionStorage.getItem("userToken");

    if (!token) {
      sessionStorage.setItem("pendingProduct", id);
      navigate("/login");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const statusRes = await axios.get(
        "http://13.60.35.161:5000/api/installments/status",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!statusRes.data.isEligible) {
        setErrorMessage(t("alreadyActive"));
        setLoading(false);
        return;
      }

      const applyRes = await axios.post(
        "http://13.60.35.161:5000/api/installments/apply",
        { product_id: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (applyRes.status === 201) {
        navigate("/employee/dashboard");
      }
    } catch (err) {
      console.error("❌ Error applying:", err);
      if (err.response?.status === 400) {
        setErrorMessage(err.response.data.message);
      } else {
        setErrorMessage(t("failedApply"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* 🔷 Header */}
      <header className="bg-white shadow-md p-4 flex items-center justify-between px-6 sticky top-0 z-40">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
        </Link>

        <div className="flex items-center bg-gray-100 rounded-full py-2 px-4 w-1/2 shadow-md transition-all">
          <FaSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            className="bg-transparent focus:outline-none flex-1"
          />
        </div>

        <FaUserCircle className="text-gray-700 text-2xl cursor-pointer" />
      </header>

      {/* 🧠 Main Body */}
      <div className="max-w-screen-lg mx-auto p-6 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="text-blue-500 flex items-center gap-2 hover:underline"
        >
          <FaArrowLeft /> {t("back")}
        </button>

        <h1 className="text-4xl font-bold text-indigo-800">{product.name}</h1>
        <p className="text-2xl text-gray-700 font-semibold">${parseFloat(product.price).toFixed(2)}</p>

        {/* 🖼 Image Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, index) => (
            <img
              key={index}
              src={`http://localhost:5000/uploads/${img.trim()}`}
              alt={`Product ${index}`}
              className={`w-full h-64 object-cover rounded-md shadow-md cursor-pointer hover:scale-105 transition-transform ${
                activeImage === index ? "ring-4 ring-indigo-400" : ""
              }`}
              onClick={() => setShowPhotoIndex(index)}
              onMouseEnter={() => setActiveImage(index)}
            />
          ))}
        </div>

        {/* 📝 Description Button */}
        <button
          onClick={() => setShowDescriptionModal(true)}
          className="text-blue-600 underline mt-4 text-sm hover:text-blue-800"
        >
          {t("description")}
        </button>

        {/* 🚀 CTA Installment Bar */}
        <div className="fixed bottom-0 left-0 w-full bg-white border-t shadow-md z-40">
          <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center relative">
            <button
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-200 p-2 rounded-full"
              onClick={() => setShowDescriptionModal(true)}
            >
              <FaChevronUp className="text-gray-700" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold">${parseFloat(product.price).toFixed(2)}</p>
              <p className="text-gray-600 text-sm">{t("installmentBenefits")}</p>
            </div>
            <button
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md shadow-md transition"
              onClick={handleApplyForInstallment}
              disabled={loading}
            >
              {loading ? t("processing") : t("applyNow")}
            </button>
          </div>
        </div>

        {/* 🌌 Modal Fullscreen Image */}
        {showPhotoIndex !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
            <div className="relative max-w-4xl w-full p-4">
              <img
                src={`http://localhost:5000/uploads/${images[showPhotoIndex].trim()}`}
                alt=""
                className="w-full h-auto object-contain rounded-lg"
              />
              <button
                className="absolute top-2 right-2 bg-white px-4 py-1 rounded-md text-sm"
                onClick={() => setShowPhotoIndex(null)}
              >
                {t("close")}
              </button>
            </div>
          </div>
        )}

        {/* ❌ Error Modal */}
        {errorMessage && (
          <Modal
            title={t("error")}
            message={errorMessage}
            onClose={() => {
              setErrorMessage("");
              navigate("/employee/dashboard");
            }}
          />
        )}

        {/* 📄 Description Modal */}
        {showDescriptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white max-w-2xl p-6 rounded-lg shadow-lg relative">
              <h2 className="text-2xl font-bold text-indigo-700 mb-2">{product.name}</h2>
              <p className="text-gray-700 leading-relaxed">{product.description || t("noDescription")}</p>
              <button
                className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                onClick={() => setShowDescriptionModal(false)}
              >
                {t("close")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
