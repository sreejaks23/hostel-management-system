import { useNavigate } from "react-router-dom";
import { FiLogOut, FiBell, FiMenu } from "react-icons/fi";
import { useAuth } from "../context/AuthContext.jsx";
import { useEffect, useState } from "react";
import api from "../api/axios.js";

const Navbar = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await api.get("/notifications");
        setUnread(data.unreadCount);
      } catch {
        // ignore
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:px-6">
      <button onClick={onOpenMobileMenu} className="md:hidden text-gray-500 hover:text-gray-800">
        <FiMenu size={22} />
      </button>
      <p className="text-sm font-semibold text-gray-800 md:hidden">HostelMS</p>
      <div className="ml-auto flex items-center gap-4">
        <button onClick={() => navigate("/notifications")} className="relative text-gray-500 hover:text-gray-800">
          <FiBell size={20} />
          {unread > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className="hidden text-sm font-medium text-gray-700 sm:block">{user?.name}</span>
        </div>
        <button onClick={handleLogout} className="text-gray-500 hover:text-red-600" title="Logout">
          <FiLogOut size={19} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
