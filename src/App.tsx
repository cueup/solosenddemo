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
  MoreVertical
} from 'lucide-react';
import { EmailEditor } from './components/EmailEditor';
import { SmsEditor } from './components/SmsEditor';
import { LetterEditor } from './components/LetterEditor';
import { ContactTimeline } from './components/ContactTimeline';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeEditor, setActiveEditor] = useState<'email' | 'sms' | 'letter' | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('All Tags');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);

  const allContacts = [
    { title: 'Mrs', name: 'Alice Johnson', email: 'alice.johnson@email.com', phone: '+44 20 7123 4567', address: '123 High Street, London', tags: ['VIP', 'Government'] },
    { title: 'Mr', name: 'Robert Smith', email: 'robert.smith@email.com', phone: '+44 20 7234 5678', address: '456 Park Road, Manchester', tags: ['Citizens'] },
    { title: 'Miss', name: 'Emma Williams', email: 'emma.williams@email.com', phone: '+44 20 7345 6789', address: '789 Queen Avenue, Birmingham', tags: ['Business'] },
    { title: 'Mr', name: 'James Brown', email: 'james.brown@email.com', phone: '+44 20 7456 7890', address: '321 King Street, Leeds', tags: ['Government'] },
    { title: 'Ms', name: 'Sophie Davis', email: 'sophie.davis@email.com', phone: '+44 20 7567 8901', address: '654 Main Road, Liverpool', tags: ['Citizens', 'VIP'] },
    { title: 'Dr', name: 'Michael Wilson', email: 'michael.wilson@email.com', phone: '+44 20 7678 9012', address: '987 Church Lane, Bristol', tags: ['Business'] }
  ];

  const filteredContacts = selectedTagFilter === 'All Tags'
    ? allContacts
    : allContacts.filter(contact => contact.tags.includes(selectedTagFilter));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-black text-white border-b-8 border-yellow-400">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-400 text-black px-3 py-1 font-bold text-sm">GOV.UK</div>
              <h1 className="text-xl font-bold">Notify</h1>
            </div>
            <div className="flex items-center gap-6">
              <button className="hover:text-yellow-400 transition-colors">
                <Bell size={20} />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium">JD</span>
                </div>
                <span className="text-sm">John Doe</span>
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
                  <QuickActionButton icon={Upload} label="Upload Bulk Recipients" />
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
                <MessageRow
                  type="email"
                  subject="Service update notification"
                  recipients="1,245"
                  sent="Today at 09:30"
                  delivered="1,243"
                />
                <MessageRow
                  type="sms"
                  subject="Appointment confirmation"
                  recipients="856"
                  sent="Today at 08:15"
                  delivered="856"
                />
                <MessageRow
                  type="letter"
                  subject="Annual tax reminder"
                  recipients="3,421"
                  sent="Yesterday at 14:20"
                  delivered="3,420"
                />
                <MessageRow
                  type="email"
                  subject="Password reset request"
                  recipients="45"
                  sent="Yesterday at 11:05"
                  delivered="45"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Templates</h2>
                <p className="text-gray-600">Create and manage message templates</p>
              </div>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold">
                <Plus size={20} />
                Create Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <TemplateCard
                type="email"
                title="Welcome Email"
                description="Sent to new users upon registration"
                lastEdited="2 days ago"
              />
              <TemplateCard
                type="sms"
                title="Appointment Reminder"
                description="24-hour reminder for upcoming appointments"
                lastEdited="5 days ago"
              />
              <TemplateCard
                type="letter"
                title="Annual Statement"
                description="Yearly financial summary letter"
                lastEdited="1 week ago"
              />
              <TemplateCard
                type="email"
                title="Password Reset"
                description="Security notification for password changes"
                lastEdited="3 days ago"
              />
              <TemplateCard
                type="sms"
                title="Verification Code"
                description="Two-factor authentication codes"
                lastEdited="1 day ago"
              />
              <TemplateCard
                type="email"
                title="Service Update"
                description="Important service announcements"
                lastEdited="4 days ago"
              />
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
                <button className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 font-semibold">
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
                    onClick={() => setSelectedContact(contact.name)}
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

        {activeTab === 'team' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Team Members</h2>
                <p className="text-gray-600">Collaborate with your team</p>
              </div>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold">
                <Plus size={20} />
                Invite Team Member
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
              <TeamMember
                name="John Doe"
                email="john.doe@example.gov.uk"
                role="Admin"
                status="Active"
              />
              <TeamMember
                name="Sarah Smith"
                email="sarah.smith@example.gov.uk"
                role="Editor"
                status="Active"
              />
              <TeamMember
                name="Michael Johnson"
                email="michael.j@example.gov.uk"
                role="Viewer"
                status="Active"
              />
              <TeamMember
                name="Emily Brown"
                email="emily.brown@example.gov.uk"
                role="Editor"
                status="Pending"
              />
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Settings</h2>
              <p className="text-gray-600">Configure your notification preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingsCard
                icon={Mail}
                title="Email Settings"
                description="Configure email branding and reply-to addresses"
              />
              <SettingsCard
                icon={MessageSquare}
                title="Text Message Settings"
                description="Manage sender ID and international numbers"
              />
              <SettingsCard
                icon={FileText}
                title="Letter Settings"
                description="Set up letter branding and postage preferences"
              />
              <SettingsCard
                icon={Globe}
                title="API Configuration"
                description="Manage API keys and integration settings"
              />
            </div>
          </div>
        )}
      </div>

      {activeEditor === 'email' && <EmailEditor onClose={() => setActiveEditor(null)} />}
      {activeEditor === 'sms' && <SmsEditor onClose={() => setActiveEditor(null)} />}
      {activeEditor === 'letter' && <LetterEditor onClose={() => setActiveEditor(null)} />}
      {selectedContact && <ContactTimeline contactName={selectedContact} onClose={() => setSelectedContact(null)} />}
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

function MessageRow({ type, subject, recipients, sent, delivered }: {
  type: string;
  subject: string;
  recipients: string;
  sent: string;
  delivered: string;
}) {
  const icons = {
    email: Mail,
    sms: MessageSquare,
    letter: FileText
  };
  const Icon = icons[type as keyof typeof icons];

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors cursor-pointer">
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
          <CheckCircle2 size={18} className="text-green-600" />
          <span className="text-sm font-medium text-gray-900">{delivered} delivered</span>
          <ChevronRight size={18} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
}

function TemplateCard({ type, title, description, lastEdited }: {
  type: string;
  title: string;
  description: string;
  lastEdited: string;
}) {
  const icons = {
    email: Mail,
    sms: MessageSquare,
    letter: FileText
  };
  const Icon = icons[type as keyof typeof icons];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon size={24} className="text-gray-600" />
        </div>
        <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded">{type}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <p className="text-xs text-gray-500">Last edited {lastEdited}</p>
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

function SettingsCard({ icon: Icon, title, description }: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon size={24} className="text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 mb-4">{description}</p>
          <button className="text-blue-600 text-sm font-semibold hover:text-blue-700 flex items-center gap-1">
            Configure
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
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

export default App;
