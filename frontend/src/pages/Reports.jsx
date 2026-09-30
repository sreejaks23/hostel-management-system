import { useEffect, useState } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import toast from "react-hot-toast";
import api from "../api/axios.js";
import Loader from "../components/Loader.jsx";

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#0891b2"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [revenue, setRevenue] = useState({ revenueByMonth: [], revenueByMethod: [] });
  const [occupancy, setOccupancy] = useState({ byType: [], byBlock: [] });
  const [financial, setFinancial] = useState(null);
  const [maintenance, setMaintenance] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [r, o, f, m] = await Promise.all([
          api.get("/reports/revenue"),
          api.get("/reports/occupancy"),
          api.get("/reports/financial-summary"),
          api.get("/reports/maintenance"),
        ]);
        setRevenue(r.data);
        setOccupancy(o.data);
        setFinancial(f.data.summary);
        setMaintenance(m.data);
      } catch {
        toast.error("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <Loader full />;

  const revenueData = revenue.revenueByMonth.map((r) => ({
    label: `${MONTHS[r._id.month - 1]} ${r._id.year}`,
    total: r.total,
  }));

  const occupancyByType = occupancy.byType.map((t) => ({ name: t._id, value: t.occupiedRooms }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Financial & Operational Reports</h1>
      <p className="text-gray-500 text-sm mb-6">Revenue, occupancy, and maintenance analytics</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="card"><p className="text-xs text-gray-500">Total Billed</p><p className="text-xl font-bold">${financial?.totalBilled.toLocaleString()}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Total Collected</p><p className="text-xl font-bold text-green-600">${financial?.totalCollected.toLocaleString()}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Outstanding</p><p className="text-xl font-bold text-red-600">${financial?.totalOutstanding.toLocaleString()}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Overdue Invoices</p><p className="text-xl font-bold text-amber-600">{financial?.overdueCount}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="card">
          <p className="font-semibold text-gray-700 mb-4">Revenue Over Time</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="label" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="font-semibold text-gray-700 mb-4">Occupied Rooms by Type</p>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={occupancyByType} dataKey="value" nameKey="name" outerRadius={90} label>
                {occupancyByType.map((entry, idx) => (
                  <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="font-semibold text-gray-700 mb-4">Occupancy by Block</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={occupancy.byBlock.map((b) => ({ block: b._id, occupied: b.occupiedRooms, total: b.totalRooms }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="block" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#cbd5e1" name="Total Rooms" />
              <Bar dataKey="occupied" fill="#2563eb" name="Occupied" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="font-semibold text-gray-700 mb-4">Maintenance Requests by Status</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={maintenance?.byStatus.map((s) => ({ status: s._id, count: s.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" />
              <XAxis dataKey="status" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#d97706" />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">Average resolution time: {maintenance?.avgResolutionHours ?? 0} hours</p>
        </div>
      </div>
    </div>
  );
};

export default Reports;
