import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { FaSave, FaEye, FaEyeSlash } from "react-icons/fa";

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [editing, setEditing] = useState({});
  const [visibility, setVisibility] = useState({});
  const [filter, setFilter] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [limit, setLimit] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const token = sessionStorage.getItem("userToken");
  const currentUser = JSON.parse(sessionStorage.getItem("user"));

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);

      const initial = {};
      res.data.forEach((u) => {
        initial[u.id] = { name: u.name, role: u.role, password: "" };
      });
      setEditing(initial);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }, [token]);

  useEffect(() => {
    if (currentUser?.email === "destin@gmail.com") {
      fetchUsers();
    }
  }, [currentUser?.email, fetchUsers]);

  const handleChange = (id, field, value) => {
    setEditing((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleTogglePassword = (id) => {
    setVisibility((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSave = async (id) => {
    const update = editing[id];
    if (!update || !update.name || !update.role) return;

    try {
      await axios.put(`http://localhost:5000/api/admin/users/${id}`, update, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMessage(`✅ "${update.name}" updated successfully.`);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const sortedUsers = [...users]
    .filter((user) =>
      user.name.toLowerCase().includes(filter.toLowerCase())
    )
    .sort((a, b) => {
      const fieldA = a[sortField]?.toLowerCase?.() || "";
      const fieldB = b[sortField]?.toLowerCase?.() || "";
      if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(sortedUsers.length / limit);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * limit,
    currentPage * limit
  );

  const handleLimitChange = (e) => {
    const value =
      e.target.value === "all" ? sortedUsers.length : parseInt(e.target.value, 10);
    setLimit(value);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (currentUser?.email !== "destin@gmail.com") {
    return (
      <div className="p-6 text-red-500 font-semibold">
        🔒 Access Denied: You are not authorized to view this page.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-indigo-700">👥 Admin User Management</h2>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="🔍 Filter by name..."
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="p-2 border rounded-md text-sm"
          />
          <select
            value={limit === sortedUsers.length ? "all" : limit}
            onChange={handleLimitChange}
            className="p-2 border rounded-md text-sm"
          >
            <option value="10">Show 10</option>
            <option value="25">Show 25</option>
            <option value="50">Show 50</option>
            <option value="all">Show All</option>
          </select>
        </div>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded shadow font-medium">
          {successMessage}
        </div>
      )}

      <div className="overflow-x-auto border rounded-md shadow">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-xs text-gray-600 uppercase">
            <tr>
              {["name", "email", "role"].map((key) => (
                <th
                  key={key}
                  className="p-3 cursor-pointer hover:underline"
                  onClick={() => handleSort(key)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}{" "}
                  {sortField === key && (sortOrder === "asc" ? "▲" : "▼")}
                </th>
              ))}
              <th className="p-3">New Password</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => {
              const state = editing[user.id] || {};
              const showPassword = visibility[user.id];
              return (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="text"
                      className="w-full p-1 border rounded"
                      value={state.name}
                      onChange={(e) => handleChange(user.id, "name", e.target.value)}
                    />
                  </td>
                  <td className="p-3 text-xs text-gray-500">{user.email}</td>
                  <td className="p-3">
                    <select
                      value={state.role}
                      onChange={(e) => handleChange(user.id, "role", e.target.value)}
                      className="w-full p-1 border rounded"
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="p-3 relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={state.password || ""}
                      onChange={(e) => handleChange(user.id, "password", e.target.value)}
                      placeholder="••••••"
                      className="w-full p-1 border rounded pr-8"
                    />
                    <button
                      onClick={() => handleTogglePassword(user.id)}
                      className="absolute right-2 top-2 text-gray-500"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-2 hover:bg-blue-700"
                      onClick={() => handleSave(user.id)}
                    >
                      <FaSave />
                      Save
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {limit !== sortedUsers.length && (
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <div className="space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
