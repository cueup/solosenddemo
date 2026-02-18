import { ChevronRight } from 'lucide-react';

export function SettingsCard({ icon: Icon, title, description, href }: {
  icon: any;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon size={24} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          <span className="text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-1">
            Configure
            <ChevronRight size={16} />
          </span>
        </div>
      </div>
    </a>
  );
}
