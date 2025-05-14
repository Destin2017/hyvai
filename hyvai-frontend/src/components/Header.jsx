import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUserCircle, FaSearch, FaSignOutAlt } from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";

const Header = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    setIsDropdownOpen(false); //  Close dropdown immediately
    logout(() => {
      navigate("/", { replace: true }); //  Redirect instantly to home page
    });
  };

  return (
    <header className="bg-white shadow-md p-4 flex items-center justify-between px-6">
      {/*  Logo */}
      <Link to="/" className="flex items-center">
        <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
      </Link>

      {/*  Search Bar */}
      <div className="flex items-center bg-gray-100 rounded-full py-2 px-4 w-1/2 shadow-md">
        <FaSearch className="text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search..."
          className="bg-transparent focus:outline-none flex-1"
        />
      </div>

      {/*  User Profile Dropdown */}
      <div className="relative">
        <button
          className="flex items-center space-x-2 focus:outline-none"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <span className="text-gray-700 font-semibold">{user ? user.name : "Guest"}</span>
          <FaUserCircle className="text-gray-700 text-2xl cursor-pointer" />
        </button>

        {/*  Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg rounded-md overflow-hidden z-50">
            <button
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-200 flex items-center space-x-2"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
