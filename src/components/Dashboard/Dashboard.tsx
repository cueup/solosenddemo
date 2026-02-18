import { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  MessageSquare,
  FileText,
  Send,
  Users,
  BarChart3,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronRight,
  Upload,
  Zap,
  UserCircle,
  Filter,
  Key
} from 'lucide-react';
import { useService } from '../../contexts/ServiceContext';
import { TeamManagement } from '../Team/TeamManagement';
import { EmailEditor } from '../EmailEditor';
import { SmsEditor } from '../SmsEditor';
import { LetterEditor } from '../LetterEditor';
import { TemplateEditor } from '../TemplateEditor';
import { ContactImporter } from '../ContactImporter';
import { ContactDetailsModal } from '../ContactDetailsModal';
import { SegmentManager } from '../Contacts/SegmentManager';
import { MessageDetailsModal } from '../MessageDetailsModal';
import { ServiceManager } from '../Services/ServiceManager';
import { MessageTypeSelectionModal } from '../MessageTypeSelectionModal';
import { templateService, Template } from '../../services/templateService';
import { contactService, Contact } from '../../services/contactService';
import { segmentService, Segment } from '../../services/segmentService';
import { contactPreferenceService, ContactPreferences } from '../../services/contactPreferenceService';
import { messageService, Message } from '../../services/messageService';
import { StatCard } from './StatCard';
import { QuickActionButton } from './QuickActionButton';
import { ActivityItem } from './ActivityItem';
import { MessageRow } from './MessageRow';
import { TemplateRow } from './TemplateRow';
import { ContactRow } from './ContactRow';
import { SettingsCard } from './SettingsCard';
import { FeatureGrid } from './FeatureGrid';

export function Dashboard({ user, onSignOut }: { user: any; onSignOut: () => void }) {
  const { currentService, setCurrentService, activeApiKey, isLoading } = useService();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeEditor, setActiveEditor] = useState<'email' | 'sms' | 'letter' | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All Tags');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [showContactImporter, setShowContactImporter] = useState(false);
  const [showSegmentManager, setShowSegmentManager] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [showServiceManager, setShowServiceManager] = useState(false);
  const [showMessageTypeSelection, setShowMessageTypeSelection] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [contactPreferences, setContactPreferences] = useState<Record<string, ContactPreferences>>({});
  const [rawSegments, setRawSegments] = useState<Segment[]>([]);
  const [showContactEditor, setShowContactEditor] = useState(false);
  const [editorInitialState, setEditorInitialState] = useState<{
    id?: string,
    subject?: string;
    content?: string,
    scheduled_at?: string,
    recipient_mode?: 'contact' | 'segment' | 'manual',
    template_id?: string,
    segment_id?: string,
    metadata?: any
  } | undefined>(undefined);
  const [messages, setMessages] = useState<Message[]>([]);

  const segments = useMemo(() => {
    return rawSegments.map(segment => ({
      ...segment,
      contactCount: segmentService.getMatchingContacts(segment.filters, allContacts, contactPreferences).length
    }));
  }, [rawSegments, allContacts, contactPreferences]);

  const handleEditMessage = () => {
    if (!selectedMessage) return;
    setEditorInitialState({
      id: selectedMessage.id,
      subject: selectedMessage.subject,
      content: selectedMessage.content_preview, // Map content_preview to content prop
      scheduled_at: selectedMessage.scheduled_at,
      recipient_mode: selectedMessage.recipient_mode,
      template_id: selectedMessage.template_id,
      segment_id: selectedMessage.segment_id,
      metadata: selectedMessage.metadata
    });
    setActiveEditor(selectedMessage.message_type as 'email' | 'sms' | 'letter');
    setSelectedMessage(null);
  };

  const handleSendSimilarMessage = () => {
    if (!selectedMessage) return;
    setEditorInitialState({
      subject: selectedMessage.subject,
      content: selectedMessage.content_preview // Map content_preview to content prop
    });
    setActiveEditor(selectedMessage.message_type as 'email' | 'sms' | 'letter');
    setSelectedMessage(null);
  };

  useEffect(() => {
    if (currentService) {
      loadTemplates();
      loadContacts();
      loadSegments();
      loadMessages();
    }
  }, [currentService]);

  const loadMessages = async () => {
    if (!currentService) return;
    try {
      const data = await messageService.getMessages(currentService.id);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadContacts = async () => {
    if (!currentService) return;
    try {
      const contactsData = await contactService.getContacts(currentService.id);
      setAllContacts(contactsData);

      if (contactsData.length > 0) {
        const preferencesData = await contactPreferenceService.getPreferencesForContacts(contactsData.map(c => c.id));
        setContactPreferences(preferencesData);
      } else {
        setContactPreferences({});
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadTemplates = async () => {
    if (!currentService) return;
    try {
      const data = await templateService.getTemplates(currentService.id);
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadSegments = async () => {
    if (!currentService) return;
    try {
      const data = await segmentService.getSegments(currentService.id);
      setRawSegments(data);
    } catch (error) {
      console.error('Error loading segments:', error);
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }
  };

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    allContacts.forEach(contact => {
      (contact.tags || []).forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [allContacts]);

  const filteredContacts = useMemo(() => {
    return allContacts.filter(contact => {
      const matchesTag = selectedTagFilter === 'All Tags' || (contact.tags || []).includes(selectedTagFilter);
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery ||
        `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(searchStr) ||
        contact.email?.toLowerCase().includes(searchStr) ||
        contact.phone?.toLowerCase().includes(searchStr);

      return matchesTag && matchesSearch;
    });
  }, [allContacts, selectedTagFilter, searchQuery]);

  const handleSaveTemplate = async (templateData: Omit<Template, 'id' | 'created_at' | 'updated_at' | 'service_id'>) => {
    if (!currentService) return;

    try {
      if (editingTemplate) {
        // Update existing template
        const updated = await templateService.updateTemplate(editingTemplate.id, templateData);
        setTemplates(templates.map(t => t.id === editingTemplate.id ? updated : t));
      } else {
        // Create new template
        const newTemplate = await templateService.createTemplate({
          ...templateData,
          service_id: currentService.id
        });
        setTemplates([newTemplate, ...templates]);
      }
      setShowTemplateEditor(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowTemplateEditor(true);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await templateService.deleteTemplate(templateId);
        setTemplates(templates.filter(t => t.id !== templateId));
      } catch (error) {
        console.error('Error deleting template:', error);
        alert('Failed to delete template');
      }
    }
  };

  const handleImportContacts = async (importedContacts: any[]) => {
    if (!currentService) return;

    try {
      const createPromises = importedContacts.map(contact =>
        contactService.createContact({
          service_id: currentService.id,
          title: contact.title,
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.email,
          phone: contact.phone,
          address_line_1: contact.address_line_1,
          address_line_2: contact.address_line_2,
          address_line_3: contact.address_line_3,
          address_line_4: contact.address_line_4,
          address_line_5: contact.address_line_5,
          address_line_6: contact.address_line_6,
          address_line_7: contact.address_line_7,
          postcode: contact.postcode,
          tags: contact.tags || [],
          metadata: contact.metadata
        })
      );

      const newContacts = await Promise.all(createPromises);
      setAllContacts(prevContacts => [...newContacts, ...prevContacts]);
    } catch (error) {
      console.error('Error importing contacts:', error);
      alert('Some contacts failed to import. Please check the console for details.');
    }
  };

  const handleSaveContact = async (updatedContact: Contact, preferences: ContactPreferences) => {
    if (!currentService) return;

    try {
      let contactId: string | undefined;
      if (updatedContact.id) {
        // Update existing
        const saved = await contactService.updateContact(updatedContact.id, updatedContact);
        setAllContacts(allContacts.map(c => c.id === saved.id ? saved : c));
        contactId = saved.id;
      } else {
        // Create new
        const newContact = await contactService.createContact({
          ...updatedContact,
          service_id: currentService.id
        });
        setAllContacts([newContact, ...allContacts]);
        contactId = newContact.id;
      }

      if (contactId) {
        await contactPreferenceService.savePreferences(contactId, preferences);
      }

      setShowContactEditor(false);
      setSelectedContact(null);
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact');
    }
  };

  const handleAddContact = () => {
    setSelectedContact({
      title: '',
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address_line_1: '',
      address_line_2: '',
      address_line_3: '',
      address_line_4: '',
      address_line_5: '',
      address_line_6: '',
      address_line_7: '',
      postcode: '',
      tags: [],
      service_id: currentService?.id || ''
    } as unknown as Contact);
    setShowContactEditor(true);
  };

  const handleSegmentCreated = (segment: any) => {
    console.log('New segment created:', segment);
  };

  const getTemplatesByType = (type: 'email' | 'sms' | 'letter') => {
    return templates.filter(t => t.type === type);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white border-b-8 border-yellow-400">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 text-black px-3 py-1 font-bold text-sm">GOV.UK</div>
              <h1 className="text-xl font-bold">Notify</h1>
              {currentService && (
                <div className="flex items-center gap-2 ml-4">
                  <div className="w-px h-6 bg-gray-600"></div>
                  <div className="text-sm">
                    <div className="font-medium">{currentService.name}</div>
                    {activeApiKey && (
                      <div className="text-xs text-gray-300">
                        {activeApiKey.name} ({activeApiKey.permissions})
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowServiceManager(true)}
                    className="ml-2 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition-colors"
                  >
                    Switch
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-6">
              {!currentService && (
                <button
                  onClick={() => setShowServiceManager(true)}
                  className="bg-yellow-400 text-black px-3 py-1 rounded text-sm font-medium hover:bg-yellow-300 transition-colors"
                >
                  Setup Service
                </button>
              )}
              <button className="hover:text-yellow-400 transition-colors">
                <Bell size={20} />
              </button>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {user.user_metadata?.full_name?.split(' ').map((n: string) => n[0]).join('') ||
                        user.email?.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  className="text-sm hover:text-yellow-400 transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <nav className="mb-8 border-b border-gray-300">
          <div className="flex gap-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'messages', label: 'Messages', icon: Send },
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'contacts', label: 'Contacts', icon: UserCircle },
              { id: 'team', label: 'Team', icon: Users },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 px-2 border-b-4 transition-all ${activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </nav>

        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h2>
              <p className="text-gray-600">Overview of your notifications and activity</p>
            </div>

            {!currentService && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Settings size={24} className="text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-800 mb-2">Service Setup Required</h3>
                    <p className="text-sm text-yellow-700 mb-4">
                      You need to configure a GOV.UK Notify service before you can send messages.
                      Add your service details and API keys to get started.
                    </p>
                    <button
                      onClick={() => setShowServiceManager(true)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                    >
                      Setup Service
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!activeApiKey && currentService && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Key size={24} className="text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800 mb-2">No Active API Key</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Your service "{currentService.name}" doesn't have an active API key.
                      You need to activate an API key to send messages.
                    </p>
                    <button
                      onClick={() => setShowServiceManager(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Manage API Keys
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                icon={Mail}
                title="Emails Sent"
                value="24,856"
                change="+12.5%"
                color="blue"
                costSaved="12,428"
              />
              <StatCard
                icon={MessageSquare}
                title="Text Messages"
                value="8,234"
                change="+8.2%"
                color="green"
                costSaved="4,117"
              />
              <StatCard
                icon={FileText}
                title="Letters Sent"
                value="1,456"
                change="+5.1%"
                color="orange"
                costSaved="1,165"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap size={20} className="text-blue-600" />
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <QuickActionButton icon={Mail} label="Send Email" onClick={() => setActiveEditor('email')} />
                  <QuickActionButton icon={MessageSquare} label="Send Text Message" onClick={() => setActiveEditor('sms')} />
                  <QuickActionButton icon={FileText} label="Send Letter" onClick={() => setActiveEditor('letter')} />
                  <QuickActionButton icon={Upload} label="Upload Bulk Recipients" onClick={() => setShowContactImporter(true)} />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <ActivityItem
                    type="email"
                    title="Password reset notification"
                    time="5 minutes ago"
                    status="delivered"
                  />
                  <ActivityItem
                    type="sms"
                    title="Appointment reminder"
                    time="1 hour ago"
                    status="delivered"
                  />
                  <ActivityItem
                    type="letter"
                    title="Annual statement"
                    time="2 hours ago"
                    status="processing"
                  />
                  <ActivityItem
                    type="email"
                    title="Welcome message"
                    time="3 hours ago"
                    status="delivered"
                  />
                </div>
              </div>
            </div>

            <FeatureGrid />
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Messages</h2>
                <p className="text-gray-600">View and manage all sent messages</p>
              </div>
              <button
                onClick={() => setShowMessageTypeSelection(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
              >
                <Plus size={20} />
                Send New Message
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {messages.map((message) => (
                  <MessageRow
                    key={message.id}
                    type={message.message_type}
                    subject={message.subject || (message.message_type === 'sms' ? 'Text Message' : 'No Subject')}
                    recipients={message.recipients_count.toLocaleString()}
                    sent={formatDate(message.sent_at || message.created_at)}
                    delivered={message.status === 'delivered' ? message.recipients_count.toLocaleString() : undefined}
                    status={message.status}
                    onClick={() => setSelectedMessage(message)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Templates</h2>
                <p className="text-gray-600">Create and manage message templates with variable substitution</p>
              </div>
              <button
                onClick={() => setShowTemplateEditor(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
              >
                <Plus size={20} />
                Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Total Templates</p>
                <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Email Templates</p>
                <p className="text-2xl font-bold text-gray-900">{getTemplatesByType('email').length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">SMS Templates</p>
                <p className="text-2xl font-bold text-gray-900">{getTemplatesByType('sms').length}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Letter Templates</p>
                <p className="text-2xl font-bold text-gray-900">{getTemplatesByType('letter').length}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search templates..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {templates.map((template) => (
                  <TemplateRow
                    key={template.id}
                    template={template}
                    onEdit={() => handleEditTemplate(template)}
                    onDelete={() => handleDeleteTemplate(template.id)}
                  />
                ))}
              </div>

              {templates.length === 0 && (
                <div className="p-12 text-center">
                  <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No templates found</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first template to get started</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Contacts</h2>
                <p className="text-gray-600">Manage your contact list and recipient details</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSegmentManager(true)}
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold"
                >
                  <Filter size={20} />
                  Manage Segments
                </button>
                <button
                  onClick={() => setShowContactImporter(true)}
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold"
                >
                  <Upload size={20} />
                  Import Contacts
                </button>
                <button
                  onClick={handleAddContact}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
                >
                  <Plus size={20} />
                  Add Contact
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900">8,456</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Email Contacts</p>
                <p className="text-2xl font-bold text-gray-900">7,234</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Phone Contacts</p>
                <p className="text-2xl font-bold text-gray-900">6,891</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <p className="text-sm text-gray-600 mb-1">Address Contacts</p>
                <p className="text-2xl font-bold text-gray-900">5,432</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search contacts by name, email, or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={selectedTagFilter}
                    onChange={(e) => setSelectedTagFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option>All Tags</option>
                    {availableTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredContacts.map((contact) => (
                  <ContactRow
                    key={contact.id}
                    title={contact.title}
                    name={`${contact.first_name} ${contact.last_name}`}
                    email={contact.email}
                    phone={contact.phone}
                    address={`${contact.address_line_1}, ${contact.postcode}`}
                    tags={contact.tags}
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowContactEditor(true);
                    }}
                  />
                ))}
              </div>

              {filteredContacts.length === 0 && (
                <div className="p-12 text-center">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No contacts found with this tag</p>
                  <p className="text-sm text-gray-400 mt-1">Try selecting a different tag</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Showing {filteredContacts.length} of {allContacts.length} contacts</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Previous</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">Next</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && <TeamManagement />}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
              <p className="text-gray-600">Configure your notification preferences and services</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div
                onClick={() => setShowServiceManager(true)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Settings size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">Service Management</h3>
                    <p className="text-sm text-gray-600 mb-4">Manage your GOV.UK Notify services and API keys</p>
                    <span className="text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-1">
                      Configure
                      <ChevronRight size={16} />
                    </span>
                  </div>
                </div>
              </div>
              <SettingsCard
                icon={Mail}
                title="Email Settings"
                description="Configure email branding and reply-to addresses"
                href="https://www.notifications.service.gov.uk/your-services"
              />
              <SettingsCard
                icon={MessageSquare}
                title="Text Message Settings"
                description="Manage sender ID and international numbers"
                href="https://www.notifications.service.gov.uk/your-services"
              />
              <SettingsCard
                icon={FileText}
                title="Letter Settings"
                description="Set up letter branding and postage preferences"
                href="https://www.notifications.service.gov.uk/your-services"
              />
            </div>
          </div>
        )}
      </div>

      {activeEditor === 'email' && <EmailEditor onClose={() => { setActiveEditor(null); setEditorInitialState(undefined); }} templates={getTemplatesByType('email')} contacts={allContacts} segments={segments} contactPreferences={contactPreferences} initialState={editorInitialState} />}
      {activeEditor === 'sms' && <SmsEditor onClose={() => { setActiveEditor(null); setEditorInitialState(undefined); }} templates={getTemplatesByType('sms')} contacts={allContacts} segments={segments} contactPreferences={contactPreferences} initialState={editorInitialState} />}
      {activeEditor === 'letter' && <LetterEditor onClose={() => { setActiveEditor(null); setEditorInitialState(undefined); }} templates={getTemplatesByType('letter')} contacts={allContacts} segments={segments} contactPreferences={contactPreferences} initialState={editorInitialState} />}
      {showContactEditor && selectedContact && (
        <ContactDetailsModal
          contact={selectedContact}
          onClose={() => {
            setShowContactEditor(false);
            setSelectedContact(null);
          }}
          onSave={handleSaveContact}
        />
      )}
      {showTemplateEditor && (
        <TemplateEditor
          template={editingTemplate}
          onClose={() => {
            setShowTemplateEditor(false);
            setEditingTemplate(null);
          }}
          onSave={handleSaveTemplate}
        />
      )}
      {showContactImporter && (
        <ContactImporter
          onClose={() => setShowContactImporter(false)}
          onImport={handleImportContacts}
        />
      )}
      {showSegmentManager && (
        <SegmentManager
          contacts={allContacts}
          onClose={() => setShowSegmentManager(false)}
          onSegmentCreated={handleSegmentCreated}
        />
      )}
      {selectedMessage && (
        <MessageDetailsModal
          message={selectedMessage}
          onClose={() => setSelectedMessage(null)}
          onEdit={handleEditMessage}
          onSendSimilar={handleSendSimilarMessage}
        />
      )}
      {showServiceManager && (
        <ServiceManager
          onClose={() => setShowServiceManager(false)}
          onServiceSelect={(service) => {
            setCurrentService(service);
            setShowServiceManager(false);
          }}
          currentService={currentService}
        />
      )}
      <MessageTypeSelectionModal
        isOpen={showMessageTypeSelection}
        onClose={() => setShowMessageTypeSelection(false)}
        onSelect={(type) => {
          setActiveEditor(type);
          setShowMessageTypeSelection(false);
        }}
      />
    </div>
  );
}
