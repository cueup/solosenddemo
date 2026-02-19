import { X } from 'lucide-react';
import { ContactEditor } from './ContactEditor';
import { ContactTimeline } from './ContactTimeline';
import { Contact } from '../services/contactService';
import { ContactPreferences } from '../services/contactPreferenceService';

interface ContactDetailsModalProps {
  contact: Contact;
  onClose: () => void;
  onSave: (contact: Contact, preferences: ContactPreferences) => void;
}

export function ContactDetailsModal({ contact, onClose, onSave }: ContactDetailsModalProps) {
  const isNewContact = !contact.id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className={`bg-white rounded-lg shadow-xl w-full ${isNewContact ? 'max-w-2xl' : 'max-w-7xl'} my-auto overflow-hidden flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isNewContact ? 'Add New Contact' : 'Contact Management'}
            </h1>
            <p className="text-gray-600">
              {isNewContact ? 'Enter the details for your new contact' : 'Manage contact details and view communication history'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className={`grid grid-cols-1 ${isNewContact ? '' : 'lg:grid-cols-2'} gap-6`}>
            <div className="h-full lg:sticky lg:top-24">
              <ContactEditor
                contact={contact}
                onClose={onClose}
                onSave={onSave}
              />
            </div>
            {!isNewContact && (
              <div>
                <ContactTimeline
                  contactId={contact.id}
                  contactName={`${contact.first_name} ${contact.last_name}`}
                  onClose={() => { }}
                  isInSidebar={true}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
