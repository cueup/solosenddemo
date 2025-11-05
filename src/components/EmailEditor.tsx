import { useState } from 'react';
import {
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Minus,
  AlignLeft,
  X,
  Calendar,
  Clock,
  Maximize2,
  Minimize2,
  Search,
  Users,
  User,
  ChevronDown,
  Mail
} from 'lucide-react';
import { notifyService } from '../services/notifyService';
import { useService } from '../contexts/ServiceContext';
interface Template {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'sms' | 'letter';
  subject?: string;
  content: string;
  variables: string[];
  notify_template_id?: string;
  created_at: string;
  updated_at: string;
}

interface Contact {
  id: string;
  title: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  address_line_3?: string;
  address_line_4?: string;
  address_line_5?: string;
  address_line_6?: string;
  postcode: string;
  tags: string[];
}

interface Segment {
  id: string;
  name: string;
  description: string;
  contact_count: number;
}

interface EmailEditorProps {
  onClose: () => void;
  templates: Template[];
  contacts: Contact[];
  segments: Segment[];
}

export function EmailEditor({ onClose, templates, contacts, segments }: EmailEditorProps) {
  const { currentService, activeApiKey } = useService();
  const [templateMode, setTemplateMode] = useState<'select' | 'manual'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [recipientMode, setRecipientMode] = useState<'contact' | 'segment' | 'manual'>('contact');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [manualRecipients, setManualRecipients] = useState('');
  const [templateId, setTemplateId] = useState('');

  const filteredContacts = (contacts || []).filter(contact => {
    const searchTerm = contactSearch.toLowerCase();
    return (
      contact.first_name.toLowerCase().includes(searchTerm) ||
      contact.last_name.toLowerCase().includes(searchTerm) ||
      contact.email.toLowerCase().includes(searchTerm) ||
      contact.address_line_1.toLowerCase().includes(searchTerm) ||
      contact.postcode.toLowerCase().includes(searchTerm)
    );
  });

  const handleContactSelect = (contact: Contact) => {
    if (!selectedContacts.find(c => c.id === contact.id)) {
      setSelectedContacts([...selectedContacts, contact]);
    }
    setContactSearch('');
    setShowContactDropdown(false);
  };

  const handleContactRemove = (contactId: string) => {
    setSelectedContacts(selectedContacts.filter(c => c.id !== contactId));
  };

  const handleSegmentSelect = (segment: Segment) => {
    setSelectedSegment(segment);
  };

  const getRecipientCount = () => {
    if (recipientMode === 'contact') {
      return selectedContacts.length;
    } else if (recipientMode === 'segment') {
      return selectedSegment?.contact_count || 0;
    } else {
      return manualRecipients.split(',').filter(email => email.trim()).length;
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = (templates || []).find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject || '');
      setContent(template.content);
      if (template.notify_template_id) {
        setTemplateId(template.notify_template_id);
        setTemplateMode('manual');
      }
    }
  };

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('email-content') as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleSend = async () => {
    if (!activeApiKey) {
      setSendError('No active API key found. Please configure your service settings.');
      return;
    }

    const finalTemplateId = templateMode === 'select' ? selectedTemplate : templateId;
    
    if (!subject.trim() || !content.trim() || !finalTemplateId.trim()) {
      setSendError('Please fill in all required fields including template selection');
      return;
    }

    if (recipientMode === 'contact' && selectedContacts.length === 0) {
      setSendError('Please select at least one contact');
      return;
    }

    if (recipientMode === 'segment' && !selectedSegment) {
      setSendError('Please select a segment');
      return;
    }

    if (recipientMode === 'manual' && !manualRecipients.trim()) {
      setSendError('Please enter email addresses');
      return;
    }

    setIsSending(true);
    setSendError('');

    try {
      let emailAddresses: string[] = [];
      
      if (recipientMode === 'contact') {
        emailAddresses = selectedContacts.map(contact => contact.email);
      } else if (recipientMode === 'manual') {
        emailAddresses = manualRecipients.split(',').map(email => email.trim());
      }
      // For segment mode, you would typically fetch contacts from the segment
      
      // Use the active API key for sending
      for (const emailAddress of emailAddresses) {
        await notifyService.sendEmail(finalTemplateId, emailAddress, {
          personalisation: {
            subject: subject,
            content: content
          },
          reference: `email-${currentService?.name}-${Date.now()}`
        }, activeApiKey.key);
      }

      // Close the editor on successful send
      onClose();
    } catch (error: any) {
      setSendError(error.message || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  const handleSchedule = async () => {
    const finalTemplateId = templateMode === 'select' ? selectedTemplate : templateId;
    
    if (!subject.trim() || !content.trim() || !finalTemplateId.trim() || !scheduleDate || !scheduleTime) {
      setSendError('Please fill in all required fields including template selection, schedule date and time');
      return;
    }

    if (recipientMode === 'contact' && selectedContacts.length === 0) {
      setSendError('Please select at least one contact');
      return;
    }

    if (recipientMode === 'segment' && !selectedSegment) {
      setSendError('Please select a segment');
      return;
    }

    if (recipientMode === 'manual' && !manualRecipients.trim()) {
      setSendError('Please enter email addresses');
      return;
    }

    // For now, just show success message as scheduling would require additional backend logic
    alert('Email scheduled successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full overflow-hidden flex flex-col transition-all ${
        isFullScreen ? 'max-w-full h-full m-0' : 'max-w-4xl max-h-[90vh]'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Email</h2>
              <p className="text-sm text-gray-600">Create and send email notifications</p>
              {currentService && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">Service:</span>
                  <span className="text-xs font-medium text-gray-700">{currentService.name}</span>
                  {activeApiKey && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        activeApiKey.type === 'live' 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {activeApiKey.type === 'live' ? 'Live' : 'Test'}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Template Selection
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="templateMode"
                  value="select"
                  checked={templateMode === 'select'}
                  onChange={(e) => setTemplateMode(e.target.value as 'select')}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="font-medium text-gray-900">Select from templates</p>
                  <p className="text-xs text-gray-500">Choose from your saved email templates</p>
                </div>
              </label>

              {templateMode === 'select' && (
                <div className="ml-7 pl-4 border-l-2 border-blue-600">
                  <select
                    value={selectedTemplate}
                    onChange={(e) => {
                      setSelectedTemplate(e.target.value);
                      handleTemplateSelect(e.target.value);
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template...</option>
                    {(templates || []).map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.description}
                      </option>
                    ))}
                  </select>
                  {selectedTemplate && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                      <p className="text-blue-800">
                        Template loaded! Content and subject have been populated. 
                        You can edit them before sending.
                      </p>
                    </div>
                  )}
                </div>
              )}

              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="templateMode"
                  value="manual"
                  checked={templateMode === 'manual'}
                  onChange={(e) => setTemplateMode(e.target.value as 'manual')}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="font-medium text-gray-900">Enter template ID manually</p>
                  <p className="text-xs text-gray-500">Input a specific template ID</p>
                </div>
              </label>

              {templateMode === 'manual' && (
                <div className="ml-7 pl-4 border-l-2 border-blue-600">
                  <input
                    type="text"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                    placeholder="Enter GOV.UK Notify template ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The template ID from your GOV.UK Notify account
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email Content
            </label>

            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-1">
                <button
                  onClick={() => insertFormatting('# ', '\n')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Heading 1"
                >
                  <Heading1 size={18} />
                </button>
                <button
                  onClick={() => insertFormatting('## ', '\n')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Heading 2"
                >
                  <Heading2 size={18} />
                </button>
                <div className="w-px bg-gray-300 mx-1" />
                <button
                  onClick={() => insertFormatting('* ')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Bullet point"
                >
                  <List size={18} />
                </button>
                <button
                  onClick={() => insertFormatting('1. ')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Numbered list"
                >
                  <ListOrdered size={18} />
                </button>
                <div className="w-px bg-gray-300 mx-1" />
                <button
                  onClick={() => insertFormatting('---\n')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Horizontal line"
                >
                  <Minus size={18} />
                </button>
                <button
                  onClick={() => insertFormatting('^ ')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Inset text"
                >
                  <AlignLeft size={18} />
                </button>
              </div>

              <textarea
                id="email-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your email content here...&#10;&#10;Formatting options:&#10;# Heading 1&#10;## Heading 2&#10;* Bullet point&#10;1. Numbered list&#10;--- Horizontal line&#10;^ Inset text"
                className="w-full p-4 min-h-[300px] focus:outline-none resize-none"
              />
            </div>

            <div className="mt-2 text-sm text-gray-600">
              <p className="font-medium mb-1">Available formatting:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Bullet points</li>
                <li>Headings</li>
                <li>Horizontal lines</li>
                <li>Inset text</li>
                <li>Numbered steps</li>
              </ul>
              <p className="mt-2 text-xs text-gray-500">
                Note: Bold, italics, underlined text, and different fonts are not supported for accessibility reasons.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Recipients
            </label>
            <div className="space-y-3">
              <div className="flex gap-3">
                <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex-1">
                  <input
                    type="radio"
                    name="recipientMode"
                    value="contact"
                    checked={recipientMode === 'contact'}
                    onChange={(e) => setRecipientMode(e.target.value as 'contact')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <User size={18} className="text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Select Contacts</p>
                    <p className="text-xs text-gray-500">Choose individual contacts</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex-1">
                  <input
                    type="radio"
                    name="recipientMode"
                    value="segment"
                    checked={recipientMode === 'segment'}
                    onChange={(e) => setRecipientMode(e.target.value as 'segment')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <Users size={18} className="text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Select Segment</p>
                    <p className="text-xs text-gray-500">Choose a contact segment</p>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors flex-1">
                  <input
                    type="radio"
                    name="recipientMode"
                    value="manual"
                    checked={recipientMode === 'manual'}
                    onChange={(e) => setRecipientMode(e.target.value as 'manual')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <p className="font-medium text-gray-900">Manual Entry</p>
                    <p className="text-xs text-gray-500">Type email addresses</p>
                  </div>
                </label>
              </div>

              {recipientMode === 'contact' && (
                <div className="space-y-3">
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        value={contactSearch}
                        onChange={(e) => {
                          setContactSearch(e.target.value);
                          setShowContactDropdown(true);
                        }}
                        onFocus={() => setShowContactDropdown(true)}
                        placeholder="Search contacts by name, email, address, or postcode..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {showContactDropdown && contactSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredContacts.length > 0 ? (
                          filteredContacts.slice(0, 10).map((contact) => (
                            <button
                              key={contact.id}
                              onClick={() => handleContactSelect(contact)}
                              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                            >
                              <div className="font-medium text-gray-900">
                                {contact.title} {contact.first_name} {contact.last_name}
                              </div>
                              <div className="text-sm text-gray-600">{contact.email}</div>
                              <div className="text-xs text-gray-500">
                                {contact.address_line_1}, {contact.postcode}
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-3 text-gray-500 text-sm">No contacts found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {selectedContacts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Selected Contacts ({selectedContacts.length})
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-2">
                        {selectedContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg"
                          >
                            <div>
                              <div className="font-medium text-blue-900">
                                {contact.title} {contact.first_name} {contact.last_name}
                              </div>
                              <div className="text-sm text-blue-700">{contact.email}</div>
                            </div>
                            <button
                              onClick={() => handleContactRemove(contact.id)}
                              className="p-1 hover:bg-blue-100 rounded transition-colors"
                              title="Remove contact"
                            >
                              <X size={16} className="text-blue-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {recipientMode === 'segment' && (
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={selectedSegment?.id || ''}
                      onChange={(e) => {
                        const segment = (segments || []).find(s => s.id === e.target.value);
                        handleSegmentSelect(segment || null);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Select a segment...</option>
                      {(segments || []).map((segment) => (
                        <option key={segment.id} value={segment.id}>
                          {segment.name} ({segment.contact_count} contacts)
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  </div>

                  {selectedSegment && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-medium text-green-900">{selectedSegment.name}</div>
                      <div className="text-sm text-green-700">{selectedSegment.description}</div>
                      <div className="text-xs text-green-600 mt-1">
                        {selectedSegment.contact_count} contacts will receive this email
                      </div>
                    </div>
                  )}
                </div>
              )}

              {recipientMode === 'manual' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={manualRecipients}
                    onChange={(e) => setManualRecipients(e.target.value)}
                    placeholder="Enter email addresses separated by commas"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    Enter multiple email addresses separated by commas
                  </p>
                </div>
              )}

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Total Recipients:</span>
                  <span className="text-sm font-bold text-gray-900">{getRecipientCount()}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Delivery Schedule
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="schedule"
                  value="now"
                  checked={scheduleMode === 'now'}
                  onChange={(e) => setScheduleMode(e.target.value as 'now')}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">Send now</p>
                    <p className="text-xs text-gray-500">Message will be sent immediately</p>
                  </div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="schedule"
                  value="scheduled"
                  checked={scheduleMode === 'scheduled'}
                  onChange={(e) => setScheduleMode(e.target.value as 'scheduled')}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex items-center gap-2 flex-1">
                  <Calendar size={18} className="text-gray-600" />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">Schedule for later</p>
                    <p className="text-xs text-gray-500">Choose a date and time</p>
                  </div>
                </div>
              </label>

              {scheduleMode === 'scheduled' && (
                <div className="ml-7 pl-4 border-l-2 border-blue-600 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  {scheduleDate && scheduleTime && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <p className="text-xs text-blue-800">
                        Scheduled for: {new Date(`${scheduleDate}T${scheduleTime}`).toLocaleString('en-GB', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          {sendError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{sendError}</p>
            </div>
          )}
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              disabled={isSending}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <div className="flex gap-3">
              <button 
                disabled={isSending}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
              >
                Save Draft
              </button>
              <button 
                onClick={scheduleMode === 'now' ? handleSend : handleSchedule}
                disabled={isSending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {isSending ? 'Sending...' : (scheduleMode === 'now' ? 'Send Email' : 'Schedule Email')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
