import { Mail, Upload, MessageSquare, Globe, FileText, Zap } from 'lucide-react';

export function FeatureGrid() {
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
