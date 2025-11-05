import { useState } from 'react';
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
  CheckCircle2,
  Globe,
  Upload,
  Zap,
  UserCircle,
  Phone,
  MapPin,
  Tag,
  MoreVertical,
  Edit,
  Trash2,
  Filter,
  Key
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ServiceProvider, useService } from './contexts/ServiceContext';
import { LoginForm } from './components/Auth/LoginForm';
import { TeamManagement } from './components/Team/TeamManagement';
import { EmailEditor } from './components/EmailEditor';
import { SmsEditor } from './components/SmsEditor';
import { LetterEditor } from './components/LetterEditor';
import { ContactTimeline } from './components/ContactTimeline';
import { TemplateEditor } from './components/TemplateEditor';
import { ContactImporter } from './components/ContactImporter';
import { ContactDetailsModal } from './components/ContactDetailsModal';
import { SegmentManager } from './components/Contacts/SegmentManager';
import { MessageDetailsModal } from './components/MessageDetailsModal';
import { ServiceManager } from './components/Services/ServiceManager';

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

function AppContent() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <ServiceProvider>
      <Dashboard user={user} onSignOut={signOut} />
    </ServiceProvider>
  );
}

function Dashboard({ user, onSignOut }: { user: any; onSignOut: () => void }) {
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
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      name: 'Welcome Email',
      description: 'Sent to new users upon registration',
      type: 'email',
      subject: 'Welcome to our service, {{firstName}}!',
      content: 'Dear {{title}} {{lastName}},\n\nWelcome to our government service! We\'re pleased to have you on board.\n\nYour account details:\n- Name: {{firstName}} {{lastName}}\n- Email: {{email}}\n- Registration Date: {{registrationDate}}\n\nIf you have any questions, please don\'t hesitate to contact us.\n\nBest regards,\nThe Government Service Team',
      variables: ['title', 'firstName', 'lastName', 'email', 'registrationDate'],
      notify_template_id: 'email-welcome-001',
      created_at: '2024-10-20T10:00:00Z',
      updated_at: '2024-10-20T10:00:00Z'
    },
    {
      id: '2',
      name: 'Appointment Reminder',
      description: '24-hour reminder for upcoming appointments',
      type: 'sms',
      content: 'Hi {{firstName}}, this is a reminder that you have an appointment tomorrow at {{appointmentTime}} at {{location}}. Please arrive 10 minutes early. Reply STOP to opt out.',
      variables: ['firstName', 'appointmentTime', 'location'],
      notify_template_id: 'sms-appointment-001',
      created_at: '2024-10-19T14:30:00Z',
      updated_at: '2024-10-19T14:30:00Z'
    },
    {
      id: '3',
      name: 'Annual Statement',
      description: 'Yearly financial summary letter',
      type: 'letter',
      subject: 'Your Annual Statement - {{year}}',
      content: 'Dear {{title}} {{lastName}},\n\nPlease find enclosed your annual statement for the year {{year}}.\n\nAccount Summary:\n- Account Number: {{accountNumber}}\n- Total Contributions: £{{totalContributions}}\n- Current Balance: £{{currentBalance}}\n\nIf you have any questions about this statement, please contact us on {{contactNumber}}.\n\nYours sincerely,\n{{departmentName}}',
      variables: ['title', 'lastName', 'year', 'accountNumber', 'totalContributions', 'currentBalance', 'contactNumber', 'departmentName'],
      notify_template_id: 'letter-annual-001',
      created_at: '2024-10-18T09:15:00Z',
      updated_at: '2024-10-18T09:15:00Z'
    },
    {
      id: '4',
      name: 'Password Reset',
      description: 'Security notification for password changes',
      type: 'email',
      subject: 'Password Reset Request',
      content: 'Dear {{firstName}},\n\nWe received a request to reset your password for your government service account.\n\nIf you requested this change, please click the link below:\n{{resetLink}}\n\nThis link will expire in 24 hours.\n\nIf you did not request this password reset, please ignore this email and contact our support team immediately.\n\nSecurity Team\n{{serviceName}}',
      variables: ['firstName', 'resetLink', 'serviceName'],
      notify_template_id: 'email-password-002',
      created_at: '2024-10-17T16:45:00Z',
      updated_at: '2024-10-17T16:45:00Z'
    },
    {
      id: '5',
      name: 'Service Alert',
      description: 'Urgent service notifications',
      type: 'sms',
      content: 'URGENT: {{serviceName}} will be unavailable from {{startTime}} to {{endTime}} on {{date}} for maintenance. We apologise for any inconvenience.',
      variables: ['serviceName', 'startTime', 'endTime', 'date'],
      notify_template_id: 'sms-alert-003',
      created_at: '2024-10-16T11:20:00Z',
      updated_at: '2024-10-16T11:20:00Z'
    },
    {
      id: '6',
      name: 'Service Update',
      description: 'Important service announcements',
      type: 'email',
      subject: 'Important Service Update - {{serviceName}}',
      content: 'Dear {{title}} {{lastName}},\n\nWe are writing to inform you of an important update to {{serviceName}}.\n\nWhat\'s changing:\n{{updateDetails}}\n\nWhen: {{effectiveDate}}\n\nWhat you need to do:\n{{actionRequired}}\n\nIf you have any questions, please contact us at {{contactEmail}} or call {{contactPhone}}.\n\nThank you for your understanding.\n\n{{departmentName}}',
      variables: ['title', 'lastName', 'serviceName', 'updateDetails', 'effectiveDate', 'actionRequired', 'contactEmail', 'contactPhone', 'departmentName'],
      notify_template_id: 'email-service-003',
      created_at: '2024-10-15T13:10:00Z',
      updated_at: '2024-10-15T13:10:00Z'
    }
  ]);

  const [sampleMessages] = useState([
    {
      id: '1',
      type: 'email',
      subject: 'Service update notification',
      recipients: '1,245',
      sent: 'Today at 09:30',
      delivered: '1,243',
      status: 'delivered' as const,
      content: 'Dear {{title}} {{lastName}},\n\nWe are writing to inform you of an important update to our online services.\n\nWhat\'s changing:\n• New security features have been added to protect your account\n• The login process has been streamlined for better user experience\n• Mobile app compatibility has been improved\n\nWhen: These changes are effective immediately\n\nWhat you need to do:\n• Update your mobile app to the latest version\n• Review your security settings when you next log in\n• Contact us if you experience any issues\n\nIf you have any questions, please contact us at support@gov.uk or call 0300 123 4567.\n\nThank you for your understanding.\n\nDigital Services Team\nHM Government',
      templateUsed: 'Service Update Template',
    },
    {
      id: '2',
      type: 'sms',
      subject: 'Appointment confirmation',
      recipients: '856',
      sent: 'Today at 08:15',
      delivered: '856',
      status: 'delivered' as const,
      content: 'Hi {{firstName}}, this is a reminder that you have an appointment tomorrow at {{appointmentTime}} at {{location}}. Please arrive 10 minutes early. Reply STOP to opt out.',
      templateUsed: 'Appointment Reminder Template',
    },
    {
      id: '3',
      type: 'email',
      subject: 'Weekly newsletter draft',
      recipients: '2,134',
      sent: 'Saved 2 hours ago',
      status: 'draft' as const,
      content: 'Dear {{title}} {{lastName}},\n\nWelcome to this week\'s government services newsletter.\n\nThis week\'s highlights:\n• New online tax filing system launched\n• Updated guidance on benefit applications\n• Upcoming changes to passport renewal process\n\nImportant dates:\n• Tax filing deadline: 31st January 2025\n• New passport fees effective: 1st December 2024\n\nFor more information, visit gov.uk or contact your local council.\n\nBest regards,\nGovernment Communications Team',
      templateUsed: 'Weekly Newsletter Template',
      scheduledFor: 'Tomorrow at 09:00',
    },
    {
      id: '4',
      type: 'letter',
      subject: 'Annual tax reminder',
      recipients: '3,421',
      sent: 'Yesterday at 14:20',
      delivered: '3,420',
      status: 'delivered' as const,
      content: 'Dear {{title}} {{lastName}},\n\nThis is your annual reminder that your tax return is due.\n\nImportant information:\n• Tax year: 2023-24\n• Filing deadline: 31st January 2025\n• Online filing is available 24/7 at gov.uk\n• Paper returns must be submitted by 31st October 2024\n\nWhat you need:\n• Your P60 or P45\n• Details of any other income\n• Records of allowable expenses\n• Bank statements\n\nIf you need help:\n• Visit gov.uk/self-assessment\n• Call the Self Assessment helpline: 0300 200 3310\n• Speak to a qualified accountant\n\nPenalties apply for late submission, so please don\'t delay.\n\nYours sincerely,\nHM Revenue & Customs',
      templateUsed: 'Annual Tax Reminder Template',
    },
    {
      id: '5',
      type: 'sms',
      subject: 'Emergency alert',
      recipients: '5,678',
      sent: 'Yesterday at 16:45',
      status: 'processing' as const,
      content: 'URGENT: Due to severe weather conditions, all government offices in the Manchester area will be closed tomorrow. Essential services remain available online at gov.uk. Stay safe.',
    },
    {
      id: '6',
      type: 'email',
      subject: 'Password reset request',
      recipients: '45',
      sent: 'Yesterday at 11:05',
      delivered: '45',
      status: 'delivered' as const,
      content: 'Dear {{firstName}},\n\nWe received a request to reset your password for your government service account.\n\nIf you requested this change, please click the link below:\n{{resetLink}}\n\nThis link will expire in 24 hours for your security.\n\nIf you did not request this password reset, please:\n• Ignore this email\n• Contact our support team immediately on 0300 123 4567\n• Consider changing your password as a precaution\n\nFor your security:\n• Never share your password with anyone\n• Use a strong, unique password\n• Enable two-factor authentication if available\n\nSecurity Team\nGovernment Digital Service',
      templateUsed: 'Password Reset Template',
    },
    {
      id: '7',
      type: 'letter',
      subject: 'Policy change notification',
      recipients: '892',
      sent: '2 days ago at 10:30',
      status: 'failed' as const,
      content: 'Dear {{title}} {{lastName}},\n\nWe are writing to inform you of important changes to our housing benefit policy.\n\nWhat\'s changing:\n• New eligibility criteria will apply from 1st April 2025\n• Application process has been simplified\n• Online applications are now available\n\nHow this affects you:\n• Your current benefits will not be affected immediately\n• You may need to provide additional documentation\n• New application forms will be required for renewals\n\nNext steps:\n• Review the new criteria at gov.uk/housing-benefit\n• Attend information sessions at your local council\n• Contact us if you have questions\n\nImportant: Failure to comply with new requirements may affect your benefit payments.\n\nYours sincerely,\nDepartment for Work and Pensions',
    },
    {
      id: '8',
      type: 'email',
      subject: 'Monthly report draft',
      recipients: '156',
      sent: 'Saved yesterday',
      status: 'draft' as const,
      content: 'Dear Team,\n\nPlease find attached the monthly performance report for October 2024.\n\nKey highlights:\n• 98.5% service availability achieved\n• Customer satisfaction score: 4.2/5\n• 15% increase in online service usage\n• Response time improved by 23%\n\nAreas for improvement:\n• Mobile app user experience\n• Call centre wait times\n• Document processing speed\n\nUpcoming initiatives:\n• New chatbot implementation\n• Staff training programme\n• System upgrade scheduled for December\n\nPlease review and provide feedback by Friday.\n\nBest regards,\nPerformance Team',
      scheduledFor: 'Monday at 09:00',
    },
  ]);

  const [allContacts, setAllContacts] = useState([
    { title: 'Mrs', name: 'Alice Johnson', email: 'alice.johnson@email.com', phone: '+44 20 7123 4567', address: '123 High Street, London', tags: ['VIP', 'Government'] },
    { title: 'Mr', name: 'Robert Smith', email: 'robert.smith@email.com', phone: '+44 20 7234 5678', address: '456 Park Road, Manchester', tags: ['Citizens'] },
    { title: 'Miss', name: 'Emma Williams', email: 'emma.williams@email.com', phone: '+44 20 7345 6789', address: '789 Queen Avenue, Birmingham', tags: ['Business'] },
    { title: 'Mr', name: 'James Brown', email: 'james.brown@email.com', phone: '+44 20 7456 7890', address: '321 King Street, Leeds', tags: ['Government'] },
    { title: 'Ms', name: 'Sophie Davis', email: 'sophie.davis@email.com', phone: '+44 20 7567 8901', address: '654 Main Road, Liverpool', tags: ['Citizens', 'VIP'] },
    { title: 'Dr', name: 'Michael Wilson', email: 'michael.wilson@email.com', phone: '+44 20 7678 9012', address: '987 Church Lane, Bristol', tags: ['Business'] }
  ]);

  const filteredContacts = selectedTagFilter === 'All Tags'
    ? allContacts
    : allContacts.filter(contact => contact.tags.includes(selectedTagFilter));

  const handleSaveTemplate = (templateData: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingTemplate) {
      // Update existing template
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...templateData, updated_at: new Date().toISOString() }
          : t
      ));
    } else {
      // Create new template
      const newTemplate: Template = {
        ...templateData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setTemplates([...templates, newTemplate]);
    }
    setShowTemplateEditor(false);
    setEditingTemplate(null);
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template);
    setShowTemplateEditor(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      setTemplates(templates.filter(t => t.id !== templateId));
    }
  };

  const handleImportContacts = (importedContacts: any[]) => {
    const newContacts = importedContacts.map(contact => ({
      title: contact.title,
      name: `${contact.firstName} ${contact.lastName}`,
      email: contact.email,
      phone: contact.phone,
      address: `${contact.address1}${contact.address2 ? ', ' + contact.address2 : ''}, ${contact.city}, ${contact.postcode}`,
      tags: contact.tags
    }));
    
    setAllContacts(prevContacts => [...prevContacts, ...newContacts]);
  };

  const handleSaveContact = (updatedContact: any) => {
    setAllContacts(prevContacts => 
      prevContacts.map(contact => 
        contact.name === selectedContact.name ? updatedContact : contact
      )
    );
    setSelectedContact(updatedContact);
  };

  const handleSegmentCreated = (segment: any) => {
    console.log('New segment created:', segment);
    // In a real app, you might want to store segments in state or send to backend
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
                        {activeApiKey.name} ({activeApiKey.type})
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
                className={`flex items-center gap-2 pb-4 px-2 border-b-4 transition-all ${
                  activeTab === tab.id
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
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold">
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
                {sampleMessages.map((message) => (
                  <MessageRow
                    key={message.id}
                    type={message.type}
                    subject={message.subject}
                    recipients={message.recipients}
                    sent={message.sent}
                    delivered={message.delivered}
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
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold">
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
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <select
                    value={selectedTagFilter}
                    onChange={(e) => setSelectedTagFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option>All Tags</option>
                    <option>VIP</option>
                    <option>Government</option>
                    <option>Citizens</option>
                    <option>Business</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {filteredContacts.map((contact, index) => (
                  <ContactRow
                    key={index}
                    title={contact.title}
                    name={contact.name}
                    email={contact.email}
                    phone={contact.phone}
                    address={contact.address}
                    tags={contact.tags}
                    onClick={() => setSelectedContact(contact)}
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

      {activeEditor === 'email' && <EmailEditor onClose={() => setActiveEditor(null)} templates={getTemplatesByType('email')} />}
      {activeEditor === 'sms' && <SmsEditor onClose={() => setActiveEditor(null)} templates={getTemplatesByType('sms')} />}
      {activeEditor === 'letter' && <LetterEditor onClose={() => setActiveEditor(null)} templates={getTemplatesByType('letter')} />}
      {selectedContact && (
        <ContactDetailsModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
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
    </div>
  );
}

function StatCard({ icon: Icon, title, value, change, color, costSaved }: {
  icon: any;
  title: string;
  value: string;
  change: string;
  color: string;
  costSaved: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon size={24} />
        </div>
        <span className="text-green-600 text-sm font-semibold">{change}</span>
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-3">{value}</p>
      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-0.5">Cost saved vs traditional services</p>
        <p className="text-lg font-semibold text-green-600">£{costSaved}</p>
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all group">
      <div className="flex items-center gap-3">
        <Icon size={20} className="text-gray-600 group-hover:text-blue-600" />
        <span className="font-medium text-gray-900">{label}</span>
      </div>
      <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-600" />
    </button>
  );
}

function ActivityItem({ type, title, time, status }: {
  type: string;
  title: string;
  time: string;
  status: string;
}) {
  const icons = {
    email: Mail,
    sms: MessageSquare,
    letter: FileText
  };
  const Icon = icons[type as keyof typeof icons];

  return (
    <div className="flex items-start gap-3">
      <div className="p-2 bg-gray-100 rounded-lg">
        <Icon size={16} className="text-gray-600" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      <div className="flex items-center gap-1">
        {status === 'delivered' ? (
          <CheckCircle2 size={16} className="text-green-600" />
        ) : (
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
        )}
        <span className="text-xs text-gray-600 capitalize">{status}</span>
      </div>
    </div>
  );
}

function MessageRow({ type, subject, recipients, sent, delivered, status, onClick }: {
  type: string;
  subject: string;
  recipients: string;
  sent: string;
  delivered?: string;
  status: 'draft' | 'sent' | 'delivered' | 'failed' | 'processing';
  onClick?: () => void;
}) {
  const icons = {
    email: Mail,
    sms: MessageSquare,
    letter: FileText
  };
  const Icon = icons[type as keyof typeof icons];

  const getStatusDisplay = () => {
    switch (status) {
      case 'draft':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
            <span className="text-sm font-medium text-gray-600">Draft</span>
          </div>
        );
      case 'sent':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full" />
            <span className="text-sm font-medium text-blue-600">Sent</span>
          </div>
        );
      case 'delivered':
        return (
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-600" />
            <span className="text-sm font-medium text-gray-900">{delivered} delivered</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-red-600 rounded-full" />
            </div>
            <span className="text-sm font-medium text-red-600">Failed</span>
          </div>
        );
      case 'processing':
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-yellow-600">Processing</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Icon size={18} className="text-gray-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{subject}</h4>
            <p className="text-sm text-gray-600">{recipients} recipients • {sent}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {getStatusDisplay()}
          <ChevronRight size={18} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
}

function TemplateRow({ template, onEdit, onDelete }: {
  template: Template;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const icons = {
    email: Mail,
    sms: MessageSquare,
    letter: FileText
  };
  const Icon = icons[template.type];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Icon size={18} className="text-gray-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{template.name}</h4>
              <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">
                {template.type}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Variables: {template.variables.length}</span>
              <span>Updated {formatDate(template.updated_at)}</span>
              {template.notify_template_id && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                  Linked to GOV.UK Notify
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            title="Edit template"
          >
            <Edit size={16} className="text-gray-600" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            title="Delete template"
          >
            <Trash2 size={16} className="text-red-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamMember({ name, email, role, status }: {
  name: string;
  email: string;
  role: string;
  status: string;
}) {
  return (
    <div className="p-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-semibold">{name.split(' ').map(n => n[0]).join('')}</span>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-600">{email}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1 rounded">{role}</span>
        <span className={`text-sm font-medium px-3 py-1 rounded ${
          status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {status}
        </span>
      </div>
    </div>
  );
}

function SettingsCard({ icon: Icon, title, description, href }: {
  icon: any;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a 
      href={href}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon size={24} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          <span className="text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-1">
            Configure
            <ChevronRight size={16} />
          </span>
        </div>
      </div>
    </a>
  );
}

function FeatureGrid() {
  const features = [
    {
      icon: Mail,
      title: 'Unlimited Free Emails',
      description: 'Send as many emails as you need at no cost'
    },
    {
      icon: Upload,
      title: 'Send Files by Email',
      description: 'Attach files to your email messages'
    },
    {
      icon: MessageSquare,
      title: 'Free Text Messages',
      description: 'Send thousands of text messages for free'
    },
    {
      icon: Globe,
      title: 'International Support',
      description: 'Send messages to international numbers'
    },
    {
      icon: FileText,
      title: 'Automatic Letters',
      description: 'We print and post your letters for you'
    },
    {
      icon: Zap,
      title: 'API Integration',
      description: 'Automate sending with our developer API'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold mb-6">Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="flex gap-3">
            <div className="p-2 bg-blue-50 rounded-lg h-fit">
              <feature.icon size={20} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h4>
              <p className="text-xs text-gray-600">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactRow({ title, name, email, phone, address, tags, onClick }: {
  title: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  tags: string[];
  onClick?: () => void;
}) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-blue-600 font-semibold text-lg">{name.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-2">{title} {name}</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="flex-shrink-0" />
                <span className="truncate">{email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="flex-shrink-0" />
                <span>{phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin size={14} className="flex-shrink-0" />
                <span className="truncate">{address}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag, index) => (
                <span key={index} className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
          <MoreVertical size={18} className="text-gray-400" />
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
