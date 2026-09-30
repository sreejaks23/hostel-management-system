const StatCard = ({ icon: Icon, label, value, accent = "text-primary-600", suffix = "" }) => (
  <div className="card flex items-center gap-4">
    <div className={`h-11 w-11 flex items-center justify-center rounded-lg bg-gray-50 ${accent}`}>
      {Icon && <Icon size={22} />}
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-900">
        {value}
        {suffix}
      </p>
    </div>
  </div>
);

export default StatCard;
