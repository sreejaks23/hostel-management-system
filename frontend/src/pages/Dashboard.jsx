import { useEffect, useState } from "react";
import { FiHome, FiUsers, FiTool, FiDollarSign, FiPercent, FiAlertCircle } from "react-icons/fi";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";
import StatCard from "../components/StatCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const Dashboard = () => {
  const { user } = useAuth();
  const isStaff = user?.role === "admin" || user?.role === "staff";
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isStaff) {
          const { data } = await api.get("/reports/dashboard");
          setStats(data.stats);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isStaff]);

  if (loading) return <Loader full />;

  if (!isStaff) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome, {user?.name} 👋</h1>
        <p className="text-gray-500 mb-6">Here's a quick overview of your account.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/billing" className="card hover:shadow-md transition-shadow">
            <p className="font-semibold text-gray-700 mb-1">💳 Billing</p>
            <p className="text-sm text-gray-500">View your invoices and make payments.</p>
          </a>
          <a href="/maintenance" className="card hover:shadow-md transition-shadow">
            <p className="font-semibold text-gray-700 mb-1">🛠️ Maintenance</p>
            <p className="text-sm text-gray-500">Submit and track maintenance requests.</p>
          </a>
          <a href="/profile" className="card hover:shadow-md transition-shadow">
            <p className="font-semibold text-gray-700 mb-1">👤 My Profile</p>
            <p className="text-sm text-gray-500">View your room and personal details.</p>
          </a>
          <a href="/notifications" className="card hover:shadow-md transition-shadow">
            <p className="font-semibold text-gray-700 mb-1">🔔 Notifications</p>
            <p className="text-sm text-gray-500">Stay updated on important events.</p>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
      <p className="text-gray-500 mb-6">Overview of hostel operations in real time.</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiHome} label="Total Rooms" value={stats?.totalRooms ?? 0} />
        <StatCard icon={FiPercent} label="Occupancy Rate" value={stats?.occupancyRate ?? 0} suffix="%" accent="text-purple-600" />
        <StatCard icon={FiUsers} label="Active Residents" value={stats?.activeResidents ?? 0} accent="text-blue-600" />
        <StatCard icon={FiTool} label="Open Maintenance" value={stats?.openMaintenance ?? 0} accent="text-amber-600" />
        <StatCard icon={FiDollarSign} label="Total Revenue" value={`$${(stats?.totalRevenue ?? 0).toLocaleString()}`} accent="text-green-600" />
        <StatCard icon={FiAlertCircle} label="Outstanding Balance" value={`$${(stats?.outstandingBalance ?? 0).toLocaleString()}`} accent="text-red-600" />
      </div>

      <div className="mt-8 card">
        <p className="font-semibold text-gray-700 mb-2">Quick Links</p>
        <div className="flex flex-wrap gap-3 text-sm">
          <a href="/rooms" className="btn-outline">Manage Rooms</a>
          <a href="/residents" className="btn-outline">Manage Residents</a>
          <a href="/maintenance" className="btn-outline">Maintenance Queue</a>
          <a href="/billing" className="btn-outline">Billing</a>
          <a href="/reports" className="btn-outline">Financial Reports</a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
