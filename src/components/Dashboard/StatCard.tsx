export function StatCard({ icon: Icon, title, value, change, color, costSaved }: {
  icon: any;
  title: string;
  value: string;
  change: string;
  color: string;
  costSaved: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon size={24} />
        </div>
        <span className="text-green-600 text-sm font-semibold">{change}</span>
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-3">{value}</p>
      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-0.5">Cost saved vs traditional services*</p>
        <p className="text-lg font-semibold text-green-600">£{costSaved}</p>
      </div>
    </div>
  );
}
