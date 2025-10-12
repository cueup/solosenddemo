import { X, Mail, MessageSquare, FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface ContactTimelineProps {
  contactName: string;
  onClose: () => void;
}

interface Communication {
  id: string;
  type: 'email' | 'sms' | 'letter';
  subject: string;
  date: string;
  status: 'delivered' | 'failed' | 'scheduled';
  content: string;
}

export function ContactTimeline({ contactName, onClose }: ContactTimelineProps) {
  const communications: Communication[] = [
    {
      id: '1',
      type: 'email',
      subject: 'Council Tax Statement 2024',
      date: '2024-10-10T14:30:00',
      status: 'delivered',
      content: 'Your council tax statement for the year 2024 has been issued...'
    },
    {
      id: '2',
      type: 'sms',
      subject: 'Appointment Reminder',
      date: '2024-10-08T09:00:00',
      status: 'delivered',
      content: 'Your appointment is scheduled for tomorrow at 2pm'
    },
    {
      id: '3',
      type: 'letter',
      subject: 'Planning Application Notice',
      date: '2024-10-05T11:00:00',
      status: 'delivered',
      content: 'This is to inform you about a planning application in your area...'
    },
    {
      id: '4',
      type: 'email',
      subject: 'Community Newsletter',
      date: '2024-10-01T10:00:00',
      status: 'delivered',
      content: 'Welcome to the October community newsletter...'
    },
    {
      id: '5',
      type: 'sms',
      subject: 'Service Update',
      date: '2024-09-28T16:45:00',
      status: 'delivered',
      content: 'Bin collection will be delayed by one day this week due to bank holiday'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'sms':
        return MessageSquare;
      case 'letter':
        return FileText;
      default:
        return Mail;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 size={16} className="text-green-600" />;
      case 'failed':
        return <XCircle size={16} className="text-red-600" />;
      case 'scheduled':
        return <Clock size={16} className="text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'failed':
        return 'Failed';
      case 'scheduled':
        return 'Scheduled';
      default:
        return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-700';
      case 'sms':
        return 'bg-green-100 text-green-700';
      case 'letter':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Communication Timeline</h2>
            <p className="text-gray-600 mt-1">{contactName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {communications.map((comm, index) => {
              const Icon = getIcon(comm.type);
              return (
                <div key={comm.id} className="relative">
                  {index !== communications.length - 1 && (
                    <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200" />
                  )}

                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${getTypeColor(comm.type)} flex-shrink-0`}>
                        <Icon size={20} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{comm.subject}</h3>
                            <p className="text-sm text-gray-600 line-clamp-2">{comm.content}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${getTypeColor(comm.type)}`}>
                            {comm.type}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 mt-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Clock size={14} />
                            <span>
                              {new Date(comm.date).toLocaleString('en-GB', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 text-sm">
                            {getStatusIcon(comm.status)}
                            <span className={
                              comm.status === 'delivered' ? 'text-green-600' :
                              comm.status === 'failed' ? 'text-red-600' :
                              'text-blue-600'
                            }>
                              {getStatusText(comm.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {communications.length === 0 && (
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No communications yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Send a message to start building this contact's timeline
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <p className="text-gray-600">
              <span className="font-semibold">{communications.length}</span> total communications
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
