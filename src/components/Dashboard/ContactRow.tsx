import { Mail, Phone, MapPin, Tag, MoreVertical } from 'lucide-react';

export function ContactRow({ title, name, email, phone, address, tags, onClick }: {
  title: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  tags: string[];
  onClick?: () => void;
}) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-semibold text-lg">{name.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-2">{title} {name}</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="flex-shrink-0" />
                <span className="truncate">{email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="flex-shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="flex-shrink-0" />
                <span className="truncate">{address}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {(tags || []).map((tag, index) => (
                <span key={index} className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
          <MoreVertical size={18} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}
