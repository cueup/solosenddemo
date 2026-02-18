import { Mail, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';

export function ActivityItem({ type, title, time, status }: {
  type: string;
  title: string;
  time: string;
  status: string;
}) {
  const icons = {
    email: Mail,
    sms: MessageSquare,
    letter: FileText
  };
  const Icon = icons[type as keyof typeof icons];

  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Icon size={16} className="text-gray-600" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <div className="flex items-center gap-1">
        {status === 'delivered' ? (
          <CheckCircle2 size={16} className="text-green-600" />
        ) : (
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        )}
        <span className="text-xs text-gray-600 capitalize">{status}</span>
      </div>
    </div>
  );
}
