import { Mail, MessageSquare, FileText, X } from 'lucide-react';

interface MessageTypeSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (type: 'email' | 'sms' | 'letter') => void;
}

export function MessageTypeSelectionModal({ isOpen, onClose, onSelect }: MessageTypeSelectionModalProps) {
    if (!isOpen) return null;

    const messageTypes = [
        {
            id: 'email',
            label: 'Email',
            description: 'Send an email to one or more recipients',
            icon: Mail,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200',
            hoverBorderColor: 'hover:border-blue-300'
        },
        {
            id: 'sms',
            label: 'Text Message',
            description: 'Send an SMS to mobile numbers',
            icon: MessageSquare,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200',
            hoverBorderColor: 'hover:border-green-300'
        },
        {
            id: 'letter',
            label: 'Letter',
            description: 'Send a physical letter via post',
            icon: FileText,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            borderColor: 'border-orange-200',
            hoverBorderColor: 'hover:border-orange-300'
        }
    ] as const;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Select Message Type</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {messageTypes.map((type) => (
                            <button
                                key={type.id}
                                onClick={() => onSelect(type.id)}
                                className={`flex flex-col items-center text-center p-6 rounded-xl border-2 transition-all ${type.bgColor} ${type.borderColor} ${type.hoverBorderColor} hover:shadow-md group`}
                            >
                                <div className={`p-4 rounded-full bg-white shadow-sm mb-4 group-hover:scale-110 transition-transform`}>
                                    <type.icon size={32} className={type.color} />
                                </div>
                                <h3 className="font-bold text-gray-900 mb-2">{type.label}</h3>
                                <p className="text-sm text-gray-600">{type.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
