import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiKey,
  FiUsers,
  FiTool,
  FiDollarSign,
  FiBarChart2,
  FiBell,
  FiUserCheck,
  FiSettings,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";

const linkClasses = ({ isActive }) =>
  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
    isActive ? "bg-primary-600 text-white" : "text-slate-300 hover:bg-surface-700 hover:text-white"
  }`;

const NavItems = ({ isStaff, user, onNavigate }) => (
  <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
    <NavLink to="/dashboard" className={linkClasses} onClick={onNavigate}>
      <FiHome /> Dashboard
    </NavLink>
    <NavLink to="/rooms" className={linkClasses} onClick={onNavigate}>
      <FiKey /> Rooms
    </NavLink>
    {isStaff && (
      <NavLink to="/residents" className={linkClasses} onClick={onNavigate}>
        <FiUsers /> Residents
      </NavLink>
    )}
    {!isStaff && (
      <NavLink to="/profile" className={linkClasses} onClick={onNavigate}>
        <FiUserCheck /> My Profile
      </NavLink>
    )}
    <NavLink to="/maintenance" className={linkClasses} onClick={onNavigate}>
      <FiTool /> Maintenance
    </NavLink>
    <NavLink to="/billing" className={linkClasses} onClick={onNavigate}>
      <FiDollarSign /> Billing
    </NavLink>
    {isStaff && (
      <NavLink to="/reports" className={linkClasses} onClick={onNavigate}>
        <FiBarChart2 /> Reports
      </NavLink>
    )}
    <NavLink to="/notifications" className={linkClasses} onClick={onNavigate}>
      <FiBell /> Notifications
    </NavLink>
    {user?.role === "admin" && (
      <NavLink to="/users" className={linkClasses} onClick={onNavigate}>
        <FiSettings /> User Management
      </NavLink>
    )}
  </nav>
);

const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "staff";

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col h-screen sticky top-0 bg-surface-900">
        <div className="px-5 py-5 border-b border-surface-700 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
            <FiHome size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">HostelMS</p>
            <p className="text-[11px] text-slate-400">Management System</p>
          </div>
        </div>
        <NavItems isStaff={isStaff} user={user} />
        <div className="px-5 py-4 border-t border-surface-700 text-xs text-slate-400">
          Logged in as <span className="font-medium text-slate-200 capitalize">{user?.role}</span>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-surface-900 flex flex-col shadow-xl">
            <div className="px-5 py-5 border-b border-surface-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                  <FiHome size={16} />
                </div>
                <p className="text-sm font-bold text-white">HostelMS</p>
              </div>
              <button onClick={onCloseMobile} className="text-slate-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>
            <NavItems isStaff={isStaff} user={user} onNavigate={onCloseMobile} />
            <div className="px-5 py-4 border-t border-surface-700 text-xs text-slate-400">
              Logged in as <span className="font-medium text-slate-200 capitalize">{user?.role}</span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
