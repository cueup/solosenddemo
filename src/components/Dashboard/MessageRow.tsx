import { Mail, MessageSquare, FileText, CheckCircle2, ChevronRight, Clock, Loader2 } from 'lucide-react';

export function MessageRow({ type, subject, recipients, sent, delivered, status, onClick }: {
  type: string;
  subject: string;
  recipients: string;
  sent: string;
  delivered?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'delivered' | 'failed' | 'processing' | 'pending' | 'cancelled';
  onClick?: () => void;
}) {
  const icons = {
    email: Mail,
    sms: MessageSquare,
    letter: FileText
  };
  const Icon = icons[type as keyof typeof icons];

  const getStatusDisplay = () => {
    switch (status) {
      case 'draft':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <span className="text-sm font-medium text-gray-600">Draft</span>
          </div>
        );
      case 'sent':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-sm font-medium text-blue-600">Sent</span>
          </div>
        );
      case 'delivered':
        return (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-600" />
            <span className="text-sm font-medium text-gray-900">{delivered} delivered</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-red-600 rounded-full" />
            </div>
            <span className="text-sm font-medium text-red-600">Failed</span>
          </div>
        );
      case 'scheduled':
        return (
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Scheduled</span>
          </div>
        );
      case 'pending':
      case 'sending':
      case 'processing':
        return (
          <div className="flex items-center gap-2">
            <Loader2 size={16} className="text-yellow-600 animate-spin" />
            <span className="text-sm font-medium text-yellow-600">Sending</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full" />
            <span className="text-sm font-medium text-gray-400">Cancelled</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Icon size={18} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{subject}</h4>
            <p className="text-sm text-gray-600">{recipients} recipients • {sent}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusDisplay()}
          <ChevronRight size={18} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
}
