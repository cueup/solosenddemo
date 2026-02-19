import { useState, useEffect } from 'react';
import { X, Save, Mail, Phone, MapPin, Tag, User, Edit3 } from 'lucide-react';
import { Contact } from '../services/contactService';
import { messageService } from '../services/messageService';
import { contactPreferenceService, ContactPreferences } from '../services/contactPreferenceService';

interface ContactEditorProps {
  contact: Contact;
  onClose: () => void;
  onSave: (contact: Contact, preferences: ContactPreferences) => void;
}

export function ContactEditor({ contact, onClose, onSave }: ContactEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Contact>(contact);
  const [newTag, setNewTag] = useState('');
  const [preferences, setPreferences] = useState<ContactPreferences>({
    email: true,
    sms: true,
    letter: true
  });
  const [stats, setStats] = useState({ total: 0, delivered: 0 });

  useEffect(() => {
    if (contact.id) {
      contactPreferenceService.getPreferences(contact.id).then(prefs => {
        if (prefs) {
          setPreferences(prefs);
        }
      });

      // Fetch communication statistics
      messageService.getMessagesForContact(contact.id).then(activities => {
        setStats({
          total: activities.length,
          delivered: activities.filter(a => a.status === 'delivered').length
        });
      });
    }
  }, [contact.id]);

  // If the contact has no ID (new contact), start in editing mode
  useState(() => {
    if (!contact.id) {
      setIsEditing(true);
    }
  });

  const handleSave = () => {
    onSave(editedContact, preferences);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (!contact.id) {
      onClose();
    } else {
      setEditedContact(contact);
      setIsEditing(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !editedContact.tags.includes(newTag.trim())) {
      setEditedContact({
        ...editedContact,
        tags: [...editedContact.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedContact({
      ...editedContact,
      tags: editedContact.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTag();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {editedContact.first_name?.[0]}{editedContact.last_name?.[0]}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {contact.id ? 'Contact Details' : 'New Contact'}
            </h2>
            <p className="text-gray-600">
              {editedContact.first_name} {editedContact.last_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 text-blue-600"
              title="Edit contact"
            >
              <Edit3 size={18} />
              <span className="text-sm font-medium">Edit</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Save size={16} />
                Save
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User size={20} className="text-blue-600" />
            Personal Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
              {isEditing ? (
                <select
                  value={editedContact.title}
                  onChange={(e) => setEditedContact({ ...editedContact, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Miss">Miss</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                  <option value="Prof">Prof</option>
                </select>
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{contact.title}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              {isEditing ? (
                <input
                  placeholder="First Name"
                  type="text"
                  value={editedContact.first_name}
                  onChange={(e) => setEditedContact({ ...editedContact, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{contact.first_name}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              {isEditing ? (
                <input
                  placeholder="Last Name"
                  type="text"
                  value={editedContact.last_name}
                  onChange={(e) => setEditedContact({ ...editedContact, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{contact.last_name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Contact Information</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail size={16} className="text-blue-600" />
                Email Address
              </label>
              {isEditing ? (
                <input
                  placeholder="Email Address"
                  type="email"
                  value={editedContact.email}
                  onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{contact.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone size={16} className="text-blue-600" />
                Phone Number
              </label>
              {isEditing ? (
                <input
                  placeholder="Phone Number"
                  type="tel"
                  value={editedContact.phone}
                  onChange={(e) => setEditedContact({ ...editedContact, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ) : (
                <p className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">{contact.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                Address
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const fieldName = `address_line_${num}` as keyof Contact;
                    const value = editedContact[fieldName] as string || '';
                    const isVisible = num === 1 || !!editedContact[`address_line_${num}` as keyof Contact] || !!editedContact[`address_line_${num - 1}` as keyof Contact];

                    if (!isVisible && num > 1) return null;

                    return (
                      <div key={num} className="flex gap-2">
                        <input
                          placeholder={`Address Line ${num}${num > 1 ? ' (Optional)' : ''}`}
                          value={value}
                          onChange={(e) => setEditedContact({ ...editedContact, [fieldName]: e.target.value })}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {num > 1 && value && (
                          <button
                            onClick={() => setEditedContact({ ...editedContact, [fieldName]: '' })}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Clear line"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      placeholder="Postcode"
                      value={editedContact.postcode}
                      onChange={(e) => setEditedContact({ ...editedContact, postcode: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="px-3 py-2 bg-gray-50 rounded-lg text-gray-900">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                    const value = contact[`address_line_${num}` as keyof Contact];
                    return value ? <p key={num}>{value as string}</p> : null;
                  })}
                  <p>{contact.postcode}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag size={20} className="text-blue-600" />
            Tags
          </h3>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {editedContact.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 text-sm font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full"
                >
                  <Tag size={12} />
                  {tag}
                  {isEditing && (
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
              {editedContact.tags.length === 0 && (
                <span className="text-sm text-gray-500 italic">No tags assigned</span>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add new tag..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Communication Preferences</h3>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-blue-600" />
                  <span className="font-medium text-gray-900">Email notifications</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.email}
                    onChange={(e) => setPreferences({ ...preferences, email: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Phone size={18} className="text-green-600" />
                  <span className="font-medium text-gray-900">SMS notifications</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.sms}
                    onChange={(e) => setPreferences({ ...preferences, sms: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-orange-600" />
                  <span className="font-medium text-gray-900">Postal letters</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={preferences.letter}
                    onChange={(e) => setPreferences({ ...preferences, letter: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Statistics */}
        {contact.id && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact Statistics</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-sm text-blue-800">Total Messages</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
                <p className="text-sm text-green-800">Delivered</p>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>Contact added: {contact.created_at ? new Date(contact.created_at).toLocaleDateString() : 'N/A'}</p>
              <p>Last updated: {isEditing ? 'Editing...' : (contact.updated_at ? new Date(contact.updated_at).toLocaleDateString() : 'N/A')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
