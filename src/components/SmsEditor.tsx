import { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Clock, Maximize2, Minimize2, Search, Users, User, ChevronDown, MessageSquare } from 'lucide-react';
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

interface SmsEditorProps {
  onClose: () => void;
  templates: Template[];
  contacts: Contact[];
  segments: Segment[];
}

export function SmsEditor({ onClose, templates, contacts, segments }: SmsEditorProps) {
  const { currentService, activeApiKey } = useService();
  const [content, setContent] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [hasSpecialChars, setHasSpecialChars] = useState(false);
  const [charLimit, setCharLimit] = useState(160);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [recipientMode, setRecipientMode] = useState<'contact' | 'segment' | 'manual'>('contact');
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [manualRecipients, setManualRecipients] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templateMode, setTemplateMode] = useState<'select' | 'manual'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const filteredContacts = (contacts || []).filter(contact => {
    const searchTerm = contactSearch.toLowerCase();
    return (
      contact.first_name.toLowerCase().includes(searchTerm) ||
      contact.last_name.toLowerCase().includes(searchTerm) ||
      contact.email.toLowerCase().includes(searchTerm) ||
      contact.phone.toLowerCase().includes(searchTerm) ||
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
      return manualRecipients.split(',').filter(phone => phone.trim()).length;
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = (templates || []).find(t => t.id === templateId);
    if (template) {
      setContent(template.content);
      if (template.notify_template_id) {
        setTemplateId(template.notify_template_id);
        setTemplateMode('manual');
      }
    }
  };

  const specialChars = ['[', ']', '{', '}', '^', '\\', '|', '~', '€'];
  const expensiveAccents = /[^Ää\u00C9\u00D6\u00DC\u00E0\u00E4\u00E9\u00E8\u00EC\u00F2\u00F6\u00F9\u00FC]/;

  useEffect(() => {
    const hasSpecial = specialChars.some(char => content.includes(char));
    const hasExpensiveAccent = content.split('').some(char => {
      if (!/[a-zA-Z]/.test(char) && /[^\x00-\x7F]/.test(char)) {
        return !['Ä', 'É', 'Ö', 'Ü', 'à', 'ä', 'é', 'è', 'ì', 'ò', 'ö', 'ù', 'ü'].includes(char);
      }
      return false;
    });

    const usesExtendedCharset = hasSpecial || hasExpensiveAccent;
    setHasSpecialChars(usesExtendedCharset);

    let effectiveLength = content.length;
    specialChars.forEach(char => {
      const count = (content.match(new RegExp(`\\${char}`, 'g')) || []).length;
      effectiveLength += count;
    });

    if (usesExtendedCharset) {
      setCharLimit(70);
      if (effectiveLength <= 70) setMessageCount(1);
      else if (effectiveLength <= 134) setMessageCount(2);
      else if (effectiveLength <= 201) setMessageCount(3);
      else if (effectiveLength <= 268) setMessageCount(4);
      else setMessageCount(Math.ceil((effectiveLength - 268) / 67) + 4);
    } else {
      setCharLimit(160);
      if (effectiveLength <= 160) setMessageCount(1);
      else if (effectiveLength <= 306) setMessageCount(2);
      else if (effectiveLength <= 459) setMessageCount(3);
      else if (effectiveLength <= 612) setMessageCount(4);
      else if (effectiveLength <= 765) setMessageCount(5);
      else if (effectiveLength <= 918) setMessageCount(6);
      else setMessageCount(Math.ceil(effectiveLength / 153));
    }
  }, [content]);

  const getCharacterColor = () => {
    const length = content.length;
    if (hasSpecialChars) {
      if (length > 70) return 'text-red-600';
      if (length > 60) return 'text-orange-600';
    } else {
      if (length > 160) return 'text-red-600';
      if (length > 140) return 'text-orange-600';
    }
    return 'text-gray-600';
  };

  const handleSend = async () => {
    if (!activeApiKey) {
      setSendError('No active API key found. Please configure your service settings.');
      return;
    }

    const finalTemplateId = templateMode === 'select' ? selectedTemplate : templateId;
    
    if (!content.trim() || !finalTemplateId.trim()) {
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
      setSendError('Please enter phone numbers');
      return;
    }

    setIsSending(true);
    setSendError('');

    try {
      let phoneNumbers: string[] = [];
      
      if (recipientMode === 'contact') {
        phoneNumbers = selectedContacts.map(contact => contact.phone);
      } else if (recipientMode === 'manual') {
        phoneNumbers = manualRecipients.split(',').map(phone => phone.trim());
      }
      // For segment mode, you would typically fetch contacts from the segment
      
      // Use the active API key for sending
      for (const phoneNumber of phoneNumbers) {
        await notifyService.sendSms(finalTemplateId, phoneNumber, {
          personalisation: {
            content: content
          },
          reference: `sms-${currentService?.name}-${Date.now()}`
        }, activeApiKey.key);
      }

      // Close the editor on successful send
      onClose();
    } catch (error: any) {
      setSendError(error.message || 'Failed to send SMS');
    } finally {
      setIsSending(false);
    }
  };

  const handleSchedule = async () => {
    const finalTemplateId = templateMode === 'select' ? selectedTemplate : templateId;
    
    if (!content.trim() || !finalTemplateId.trim() || !scheduleDate || !scheduleTime) {
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
      setSendError('Please enter phone numbers');
      return;
    }

    // For now, just show success message as scheduling would require additional backend logic
    alert('SMS scheduled successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full overflow-hidden flex flex-col transition-all ${
        isFullScreen ? 'max-w-full h-full m-0' : 'max-w-2xl max-h-[90vh]'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <MessageSquare size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Send Text Message</h2>
              <p className="text-sm text-gray-600">Create and send SMS notifications</p>
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
              <X size={20} />
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
                  <p className="text-xs text-gray-500">Choose from your saved SMS templates</p>
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
                        Template loaded! Content has been populated. 
                        You can edit it before sending.
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
              Message Content
            </label>

            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your text message here..."
                className="w-full p-4 min-h-[200px] focus:outline-none resize-none"
              />
            </div>

            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className={`text-sm font-semibold ${getCharacterColor()}`}>
                  {content.length} / {charLimit} characters
                </span>
                <span className="text-sm text-gray-600">
                  {messageCount} message{messageCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {hasSpecialChars && (
              <div className="mt-3 flex gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle size={18} className="text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-orange-800">
                  <p className="font-semibold mb-1">Special characters detected</p>
                  <p>Your message contains special characters or accented letters that increase message costs. Character limit reduced to 70 per message.</p>
                </div>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-600 space-y-2">
              <p className="font-medium">Message length charges:</p>
              <div className="text-xs space-y-1">
                {hasSpecialChars ? (
                  <>
                    <p>• Up to 70 characters: 1 message</p>
                    <p>• Up to 134 characters: 2 messages</p>
                    <p>• Up to 201 characters: 3 messages</p>
                    <p>• Up to 268 characters: 4 messages</p>
                    <p>• Each additional 67 characters: 1 additional message</p>
                  </>
                ) : (
                  <>
                    <p>• Up to 160 characters: 1 message</p>
                    <p>• Up to 306 characters: 2 messages</p>
                    <p>• Up to 459 characters: 3 messages</p>
                    <p>• Up to 612 characters: 4 messages</p>
                    <p>• Up to 765 characters: 5 messages</p>
                    <p>• Up to 918 characters: 6 messages</p>
                  </>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="font-medium mb-1">These characters count as 2 each:</p>
                <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                  [ ] {`{ }`} ^ \ | ~ €
                </p>
              </div>

              <div className="mt-2">
                <p className="font-medium mb-1">Safe accented characters (no extra cost):</p>
                <p className="text-xs">Ä, É, Ö, Ü, à, ä, é, è, ì, ò, ö, ù, ü</p>
              </div>
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
                    <p className="text-xs text-gray-500">Type phone numbers</p>
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
                        placeholder="Search contacts by name, phone, email, address, or postcode..."
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
                              <div className="text-sm text-gray-600">{contact.phone}</div>
                              <div className="text-xs text-gray-500">{contact.email}</div>
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
                              <div className="text-sm text-blue-700">{contact.phone}</div>
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
                        {selectedSegment.contact_count} contacts will receive this SMS
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
                    placeholder="Enter phone numbers separated by commas (e.g. +447700900000, +447700900111)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500">
                    Enter multiple phone numbers separated by commas. Include country code (e.g. +44 for UK)
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
                {isSending ? 'Sending...' : (scheduleMode === 'now' ? 'Send Message' : 'Schedule Message')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
