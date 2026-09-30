const COLORS = {
  available: "bg-green-100 text-green-700",
  occupied: "bg-blue-100 text-blue-700",
  maintenance: "bg-amber-100 text-amber-700",
  reserved: "bg-purple-100 text-purple-700",
  open: "bg-amber-100 text-amber-700",
  assigned: "bg-blue-100 text-blue-700",
  in_progress: "bg-indigo-100 text-indigo-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
  draft: "bg-gray-100 text-gray-700",
  issued: "bg-blue-100 text-blue-700",
  partially_paid: "bg-amber-100 text-amber-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
  checked_in: "bg-green-100 text-green-700",
  checked_out: "bg-gray-100 text-gray-700",
  pending: "bg-amber-100 text-amber-700",
  inactive: "bg-gray-100 text-gray-700",
};

const Badge = ({ status }) => (
  <span className={`badge ${COLORS[status] || "bg-gray-100 text-gray-700"}`}>
    {String(status).replace(/_/g, " ")}
  </span>
);

export default Badge;
