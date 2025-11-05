import { useState } from 'react';
import { X } from 'lucide-react';
import { ContactEditor } from './ContactEditor';
import { ContactTimeline } from './ContactTimeline';

interface Contact {
  title: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  tags: string[];
}

interface ContactDetailsModalProps {
  contact: Contact;
  onClose: () => void;
  onSave: (contact: Contact) => void;
}

export function ContactDetailsModal({ contact, onClose, onSave }: ContactDetailsModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contact Management</h1>
            <p className="text-gray-600">Manage contact details and view communication history</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 h-full">
            <div className="h-full">
              <ContactEditor
                contact={contact}
                onClose={() => {}}
                onSave={onSave}
              />
            </div>
            <div className="h-full">
              <ContactTimeline
                contactName={contact.name}
                onClose={() => {}}
                isInSidebar={true}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
