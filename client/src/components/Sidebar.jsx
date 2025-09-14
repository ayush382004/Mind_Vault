import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  FaBrain,
  FaChevronLeft,
  FaChevronRight,
  FaUserCog,
  FaBook,
  FaClock,
  FaCheckCircle,
  FaSignOutAlt,
} from "react-icons/fa";
import { auth, signOut } from "../firebase";

// Nav-link definitions
const NAV_ITEMS = [
  { id: "agent", label: "Agent Twin", icon: FaUserCog },
  { id: "notes", label: "Memory", icon: FaBook },
  { id: "capsule", label: "Legacy Capsule", icon: FaClock },
  { id: "todo", label: "To-do", icon: FaCheckCircle },
  { id: "meetings", label: "Meetings", icon: FaCheckCircle },
];

const Sidebar = ({ activeTab, setActiveTab, displayName }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  /* ───────── Persist collapse state (optional) ───────── */
  useEffect(() => {
    const stored = localStorage.getItem("sidebarCollapsed");
    if (stored) setCollapsed(JSON.parse(stored));
  }, []);
  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", JSON.stringify(collapsed));
  }, [collapsed]);

  /* ───────── Logout ───────── */
  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    navigate("/login", { replace: true });
  };

  /* ───────── Derived styles ───────── */
  const widthClass = collapsed ? "w-20" : "w-60";
  const iconOnly = collapsed && "justify-center";

  return (
    <aside
      className={`${widthClass} group flex flex-col bg-zinc-900/80 backdrop-blur-lg
                  border-r border-zinc-800 p-4 transition-[width] duration-300`}
    >
      {/* ───────── Logo + Toggle ───────── */}
      <div
        className={`mb-8 ${
          collapsed
            ? "flex flex-col items-center gap-3"
            : "flex items-center justify-between"
        }`}
      >
        {/* Logo + (optional) name */}
        <div className="flex items-center gap-2">
          <div className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <FaBrain className="text-white w-5 h-5" />
          </div>
          {!collapsed && (
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              MindVault
            </h2>
          )}
        </div>

        {/* Toggle button: below logo when collapsed, inline when expanded */}
        <button
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={`p-2 rounded-lg hover:bg-zinc-800 transition ${
            collapsed ? "" : "ml-auto"
          }`}
          onClick={() => setCollapsed((prev) => !prev)}
        >
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      {/* ───────── Nav links ───────── */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        <ul className="flex flex-col gap-1.5">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <li key={id}>
                <button
                  onClick={() => setActiveTab(id)}
                  title={label}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                              transition-colors duration-200
                              ${iconOnly}
                              ${
                                isActive
                                  ? "text-blue-100 bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/30 shadow shadow-blue-500/10"
                                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                              }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive ? "text-blue-400" : "text-zinc-500"
                    }`}
                  />
                  {!collapsed && label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ───────── Footer ───────── */}
      <footer className={`pt-5 border-t border-zinc-800 ${iconOnly}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full grid place-items-center bg-gradient-to-br from-blue-500 to-purple-600">
            <span className="font-bold">{displayName?.[0] ?? "Y"}</span>
          </div>
          {!collapsed && (
            <span className="text-sm font-medium truncate max-w-[9rem]">
              {displayName || "Your AI Twin"}
            </span>
          )}
        </div>

        <button
          onClick={handleLogout}
          title="Logout"
          className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium
                      border bg-zinc-800/60 text-zinc-300 border-zinc-800 hover:border-red-500/50 transition-all duration-200 hover:bg-red-500/10 hover:text-red-100
                      ${iconOnly}`}
        >
          <FaSignOutAlt className="w-4 h-4" />
          {!collapsed && "Logout"}
        </button>
      </footer>
    </aside>
  );
};

export default Sidebar;
