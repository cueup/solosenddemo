import { ChevronRight } from 'lucide-react';

export function QuickActionButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all group">
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-gray-600 group-hover:text-blue-600" />
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600" />
    </button>
  );
}
