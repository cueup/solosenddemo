import { X, Mail, MessageSquare, FileText, CheckCircle2, Clock, AlertCircle, Users, Calendar, Target } from 'lucide-react';
import { Message } from '../services/messageService';

interface MessageDetailsModalProps {
  message: Message;
  templateName?: string;
  onClose: () => void;
  onEdit?: () => void;
  onSendSimilar?: () => void;
}

export function MessageDetailsModal({ message, templateName, onClose, onEdit, onSendSimilar }: MessageDetailsModalProps) {
  const icons = {
    email: Mail,
    sms: MessageSquare,
    letter: FileText
  };
  const Icon = icons[message.message_type as keyof typeof icons];

  const getStatusDisplay = () => {
    switch (message.status) {
      case 'draft':
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
            <span className="text-sm font-medium text-gray-600">Draft</span>
          </div>
        );
      case 'scheduled':
        return (
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-purple-600" />
            <span className="text-sm font-medium text-purple-600">Scheduled</span>
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
      case 'pending':
        return (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-blue-600">Pending</span>
          </div>
        );
      case 'cancelled':
        return (
          <div className="flex items-center gap-2">
            <X size={16} className="text-gray-500" />
            <span className="text-sm font-medium text-gray-500">Cancelled</span>
          </div>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const formatContent = (content?: string) => {
    if (!content) return null;
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
                <span className="text-sm text-gray-600 capitalize">{message.message_type} message</span>
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
                      <span className="text-sm text-gray-900">{message.total_recipients.toLocaleString()} recipients</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Mode</label>
                    <div className="flex items-center gap-2">
                      <Target size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-900 capitalize">{message.recipient_mode}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-sm text-gray-900">{formatDate(message.created_at)}</p>
                  </div>

                  {(message.sent_at || message.status === 'sent' || message.status === 'delivered') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sent At</label>
                      <p className="text-sm text-gray-900">{formatDate(message.sent_at)}</p>
                    </div>
                  )}

                  {templateName && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Template Used</label>
                      <p className="text-sm text-gray-900">{templateName}</p>
                    </div>
                  )}

                  {message.scheduled_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled For</label>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-gray-400" />
                        <p className="text-sm text-gray-900">{formatDate(message.scheduled_at)}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                    {getStatusDisplay()}
                  </div>
                </div>
              </div>

              {(message.status === 'delivered' || message.status === 'sent' || message.status === 'failed') && (
                <div>
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Delivery Statistics</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Recipients</span>
                      <span className="text-gray-900 font-medium">{message.total_recipients.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Delivered</span>
                      <span className="text-green-600 font-medium">{message.recipients_count.toLocaleString()}</span>
                    </div>
                    {message.total_recipients > message.recipients_count && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Attempted/Pending</span>
                        <span className="text-yellow-600 font-medium">
                          {(message.total_recipients - message.recipients_count).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Message Content */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Content</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                {message.message_type === 'email' && (
                  <div className="mb-4 pb-4 border-b border-gray-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <p className="text-sm text-gray-900 font-medium">{message.subject}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {message.message_type === 'email' ? 'Email Body' :
                      message.message_type === 'sms' ? 'SMS Content' : 'Letter Content'}
                  </label>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {formatContent(message.content_preview)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {message.status === 'draft' && (
            <>
              <button
                onClick={onEdit}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={!onEdit}
              >
                Edit Draft
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Send Now
              </button>
            </>
          )}
          {message.status === 'delivered' && (
            <button
              onClick={onSendSimilar}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={!onSendSimilar}
            >
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
