import { X, Mail, MessageSquare, FileText, CheckCircle2, Clock, AlertCircle, Users } from 'lucide-react';

interface MessageDetailsModalProps {
  message: {
    type: string;
    subject: string;
    recipients: string;
    sent: string;
    delivered?: string;
    status: 'draft' | 'sent' | 'delivered' | 'failed' | 'processing';
    content: string;
    templateUsed?: string;
    scheduledFor?: string;
  };
  onClose: () => void;
}

export function MessageDetailsModal({ message, onClose }: MessageDetailsModalProps) {
  const icons = {
    email: Mail,
    sms: MessageSquare,
    letter: FileText
  };
  const Icon = icons[message.type as keyof typeof icons];

  const getStatusDisplay = () => {
    switch (message.status) {
      case 'draft':
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
            <span className="text-sm font-medium text-gray-600">Draft</span>
          </div>
        );
      case 'sent':
        return (
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Sent</span>
          </div>
        );
      case 'delivered':
        return (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-600">Delivered</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600" />
            <span className="text-sm font-medium text-red-600">Failed</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-yellow-600">Processing</span>
          </div>
        );
      default:
        return null;
    }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, index) => (
      <p key={index} className="mb-2 last:mb-0">
        {line || '\u00A0'}
      </p>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded-lg">
              <Icon size={24} className="text-gray-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{message.subject}</h2>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-sm text-gray-600 capitalize">{message.type} message</span>
                {getStatusDisplay()}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Message Details */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipients</label>
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-900">{message.recipients} recipients</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sent</label>
                    <p className="text-sm text-gray-900">{message.sent}</p>
                  </div>

                  {message.delivered && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivered</label>
                      <p className="text-sm text-gray-900">{message.delivered} delivered</p>
                    </div>
                  )}

                  {message.templateUsed && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Template Used</label>
                      <p className="text-sm text-gray-900">{message.templateUsed}</p>
                    </div>
                  )}

                  {message.scheduledFor && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled For</label>
                      <p className="text-sm text-gray-900">{message.scheduledFor}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    {getStatusDisplay()}
                  </div>
                </div>
              </div>

              {message.status === 'delivered' && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Delivery Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivered</span>
                      <span className="text-green-600 font-medium">{message.delivered}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Failed</span>
                      <span className="text-red-600 font-medium">2</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Pending</span>
                      <span className="text-yellow-600 font-medium">0</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Message Content */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Content</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                {message.type === 'email' && (
                  <div className="mb-4 pb-4 border-b border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <p className="text-sm text-gray-900 font-medium">{message.subject}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {message.type === 'email' ? 'Email Body' : 
                     message.type === 'sms' ? 'SMS Content' : 'Letter Content'}
                  </label>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {formatContent(message.content)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {message.status === 'draft' && (
            <>
              <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                Edit Draft
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Send Now
              </button>
            </>
          )}
          {message.status === 'delivered' && (
            <button className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Send Similar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
