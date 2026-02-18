import { useState, useEffect } from 'react';
import { X, Mail, MessageSquare, FileText, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { messageService } from '../services/messageService';

interface ContactTimelineProps {
  contactId: string;
  contactName: string;
  onClose: () => void;
  isInSidebar?: boolean;
}

interface Communication {
  id: string;
  type: 'email' | 'sms' | 'letter';
  subject: string;
  date: string;
  status: 'pending' | 'delivered' | 'failed' | 'blocked' | 'scheduled';
  content: string;
}

export function ContactTimeline({ contactId, contactName, onClose, isInSidebar = false }: ContactTimelineProps) {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTimeline = async () => {
      try {
        setIsLoading(true);
        const data = await messageService.getMessagesForContact(contactId);
        setCommunications(data as unknown as Communication[]);
      } catch (error) {
        console.error('Error loading contact timeline:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (contactId) {
      loadTimeline();
    }
  }, [contactId]);

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
      case 'pending':
        return <Loader2 size={16} className="text-yellow-600 animate-spin" />;
      case 'blocked':
        return <XCircle size={16} className="text-gray-400" />;
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
      case 'pending':
        return 'Sending';
      case 'blocked':
        return 'Blocked';
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-12">
          <Loader2 size={48} className="text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading communication history...</p>
        </div>
      );
    }

    if (communications.length === 0) {
      return (
        <div className="text-center py-12">
          <MessageSquare size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No communications yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Send a message to start building this contact's timeline
          </p>
        </div>
      );
    }

    return (
      <div className={`space-y-6 ${isInSidebar ? 'px-0' : 'px-2'}`}>
        {communications.map((comm, index) => {
          const Icon = getIcon(comm.type);
          return (
            <div key={comm.id} className="relative">
              {index !== communications.length - 1 && (
                <div className={`absolute ${isInSidebar ? 'left-5 top-12' : 'left-6 top-14'} bottom-0 w-0.5 bg-gray-200`} />
              )}

              <div className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow ${isInSidebar ? 'p-3' : 'p-4'}`}>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getTypeColor(comm.type)} flex-shrink-0 ${isInSidebar ? 'p-2' : 'p-3'}`}>
                    <Icon size={isInSidebar ? 16 : 20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex-1">
                        <h3 className={`font-semibold text-gray-900 mb-1 ${isInSidebar ? 'text-sm' : ''}`}>{comm.subject}</h3>
                        <p className={`text-gray-600 line-clamp-2 ${isInSidebar ? 'text-xs' : 'text-sm'}`}>{comm.content}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${getTypeColor(comm.type)}`}>
                        {comm.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <div className={`flex items-center gap-1.5 text-gray-500 ${isInSidebar ? 'text-xs' : 'text-sm'}`}>
                        <Clock size={14} />
                        <span>
                          {new Date(comm.date).toLocaleString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: isInSidebar ? undefined : 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      <div className={`flex items-center gap-1.5 ${isInSidebar ? 'text-xs' : 'text-sm'}`}>
                        {getStatusIcon(comm.status)}
                        <span className={
                          comm.status === 'delivered' ? 'text-green-600' :
                            comm.status === 'failed' ? 'text-red-600' :
                              comm.status === 'pending' ? 'text-yellow-600' :
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
    );
  };

  if (isInSidebar) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Communication Timeline</h2>
            <p className="text-gray-600 mt-1">{contactName}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>

        {!isLoading && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              <span className="font-semibold">{communications.length}</span> total communications
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
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
          {renderContent()}
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            {!isLoading && (
              <p className="text-gray-600">
                <span className="font-semibold">{communications.length}</span> total communications
              </p>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium ml-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
