import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaGlobe } from "react-icons/fa";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "fr", label: "Français", flag: "🇫🇷" },
    //{ code: "sw", label: "Swahili", flag: "🇰🇪" },
    //{ code: "pt", label: "Português", flag: "🇵🇹" },
  ];

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    setOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 🌐 Floating Globe Button */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 focus:outline-none"
      >
        <FaGlobe size={18} />
      </button>

      {/* 🌍 Language Dropdown */}
      {open && (
        <div className="mt-2 bg-white border rounded shadow-lg overflow-hidden animate-fade-in">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className="flex items-center px-4 py-2 text-sm w-full hover:bg-gray-100 transition"
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
