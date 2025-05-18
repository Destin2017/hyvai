import { useState, useEffect, useRef, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaLaptop, FaMobileAlt, FaHeadphones, FaHome, FaCamera, FaTabletAlt,
  FaChevronLeft, FaChevronRight, FaStar, FaSwimmer, FaSkiing,
  FaUserCircle, FaSearch, FaHeart, FaSignOutAlt
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";

const categoryIcons = {
  "New": <FaStar className="text-lg" />,
  "Laptops": <FaLaptop className="text-lg" />,
  "Phones": <FaMobileAlt className="text-lg" />,
  "Head Phones": <FaHeadphones className="text-lg" />,
  "E-Window Vacuum Cleaner": <FaHome className="text-lg" />,
  "EBKN Smart Hotel Door Locks": <FaTabletAlt className="text-lg" />,
  "Cameras": <FaCamera className="text-lg" />,
  "Pools": <FaSwimmer className="text-lg" />,
  "Skiing": <FaSkiing className="text-lg" />,
};

const ProductsPage = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("New");
  const [currentImages, setCurrentImages] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const scrollRef = useRef(null);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get("http://13.60.35.161:5000/api/products");
      setProducts(response.data);
      const initialImageIndexes = response.data.reduce((acc, product) => {
        acc[product.id] = 0;
        return acc;
      }, {});
      setCurrentImages(initialImageIndexes);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };


  const fetchCategories = async () => {
    try {
      const response = await axios.get("http://13.60.35.161:5000/api/categories");
      setCategories([{ id: "all", name: "New" }, ...response.data]);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const changeImage = (productId, direction) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.image) return;
    const imagesArray = product.image.split(",");
    setCurrentImages(prev => ({
      ...prev,
      [productId]: (prev[productId] + direction + imagesArray.length) % imagesArray.length
    }));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "New" || product.category_name === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔹 Navbar */}
      <header className="bg-white shadow p-4 flex items-center justify-between px-6">
        <Link to="/" className="flex items-center">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
        </Link>

        <div className="flex items-center bg-gray-100 rounded-full py-2 px-4 w-1/2 shadow-sm">
          <FaSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            className="bg-transparent focus:outline-none flex-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative">
          <button className="flex items-center space-x-2 focus:outline-none" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <span className="text-gray-700 font-semibold">{user ? user.name : t("guest")}</span>
            <FaUserCircle className="text-gray-700 text-2xl" />
          </button>
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-md z-50">
              {user ? (
                <button
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 flex items-center space-x-2"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt />
                  <span>{t("logout")}</span>
                </button>
              ) : (
                <Link to="/login?redirect=admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  🔐 {t("adminLogin")}
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 🔹 Category Selector */}
      <div className="bg-white shadow-md px-6 py-3">
        <div ref={scrollRef} className="flex space-x-6 overflow-x-auto scrollbar-hide px-4 py-1">
          {categories.map((category) => (
            <div
              key={category.id}
              className={`cursor-pointer flex flex-col items-center text-sm transition-all duration-200 ${
                selectedCategory === category.name
                  ? "text-indigo-700 font-bold underline"
                  : "text-gray-600 hover:text-indigo-500"
              }`}
              onClick={() => setSelectedCategory(category.name)}
            >
              {categoryIcons[category.name] || <FaHome className="text-lg" />}
              <span className="mt-1">{t(category.name)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const images = product.image ? product.image.split(",") : ["/placeholder.png"];
            return (
              <div
                key={product.id}
                className="bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                {/* 🔸 Image Section */}
                <div className="relative w-full h-64">
                  <Link to={`/products/${product.id}`}>
                    <img
                      src={`http://13.60.35.161:5000/uploads/${images[currentImages[product.id]]}`}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-contain rounded-lg bg-gray-100"
                      onError={(e) => { e.target.src = "/placeholder.png"; }}
                    />
                    <FaHeart
                      className={`absolute top-3 right-3 text-2xl rounded-full z-10 transition-all duration-500 ease-in-out cursor-pointer shadow-md
                        ${
                          product.is_recommended === 1
                            ? "text-pink-500 bg-pink-100 animate-heartbeat ring-2 ring-pink-300 hover:scale-125 hover:shadow-pink-500/50"
                            : "text-white bg-black bg-opacity-40"
                        } p-2`}
                      title={product.is_recommended === 1 ? "🔥 Recommended" : ""}
                    />
                  </Link>

                  {images.length > 1 && (
                    <>
                      <button
                        className="absolute top-1/2 left-2 bg-black bg-opacity-40 text-white p-2 rounded-full"
                        onClick={(e) => { e.preventDefault(); changeImage(product.id, -1); }}
                      >
                        <FaChevronLeft size={18} />
                      </button>
                      <button
                        className="absolute top-1/2 right-2 bg-black bg-opacity-40 text-white p-2 rounded-full"
                        onClick={(e) => { e.preventDefault(); changeImage(product.id, 1); }}
                      >
                        <FaChevronRight size={18} />
                      </button>
                    </>
                  )}
                </div>

                {/* 🔸 Details */}
                <div className="p-4 flex flex-col justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-md">{product.name}</h3>
                    <p className="text-gray-600">${parseFloat(product.price).toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{t(product.category_name)}</span>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">{t("installment")}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 w-full col-span-full">{t("noProductsFound")}</p>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
