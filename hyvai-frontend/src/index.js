import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // Tailwind styles
import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./context/AuthContext";

// 🧠 Import i18n config to activate translations
import "./i18n";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </React.StrictMode>
);
