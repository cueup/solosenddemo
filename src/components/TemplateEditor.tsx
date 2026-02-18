import { useState, useEffect } from 'react';
import {
  X,
  Save,
  Eye,
  Code,
  Mail,
  MessageSquare,
  FileText,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';

interface TemplateEditorProps {
  template?: Template | null;
  onClose: () => void;
  onSave: (template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) => void;
}

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

export function TemplateEditor({ template, onClose, onSave }: TemplateEditorProps) {
  const [name, setName] = useState(template?.name || '');
  const [description, setDescription] = useState(template?.description || '');
  const [type, setType] = useState<'email' | 'sms' | 'letter'>(template?.type || 'email');
  const [subject, setSubject] = useState(template?.subject || '');
  const [content, setContent] = useState(template?.content || '');
  const [notifyTemplateId, setNotifyTemplateId] = useState(template?.notify_template_id || '');
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, string>>({});

  // Common variables that users might want to use
  const commonVariables = [
    'title', 'first_name', 'last_name', 'email', 'phone',
    'address_line_1', 'address_line_2', 'address_line_3',
    'postcode', 'metadata.serviceType', 'metadata.accountNumber'
  ];

  useEffect(() => {
    // Extract variables from content and subject
    const variableRegex = /\{\{\s*([\w.]+)\s*\}\}/g;
    const foundVariables = new Set<string>();

    const extractVariables = (text: string) => {
      let match;
      while ((match = variableRegex.exec(text)) !== null) {
        foundVariables.add(match[1]);
      }
    };

    extractVariables(content);
    if (subject) extractVariables(subject);

    setDetectedVariables(Array.from(foundVariables));

    // Initialize preview data with sample values
    const sampleData: Record<string, string> = {};
    foundVariables.forEach(variable => {
      switch (variable) {
        case 'first_name':
          sampleData[variable] = 'John';
          break;
        case 'last_name':
          sampleData[variable] = 'Smith';
          break;
        case 'title':
          sampleData[variable] = 'Mr';
          break;
        case 'email':
          sampleData[variable] = 'john.smith@example.com';
          break;
        case 'phone':
          sampleData[variable] = '+44 20 7123 4567';
          break;
        case 'address_line_1':
          sampleData[variable] = '123 High Street';
          break;
        case 'postcode':
          sampleData[variable] = 'SW1A 1AA';
          break;
        case 'metadata.serviceType':
          sampleData[variable] = 'Housing Benefit';
          break;
        case 'metadata.accountNumber':
          sampleData[variable] = 'HB-12345678';
          break;
        default:
          sampleData[variable] = `[${variable}]`;
      }
    });
    setPreviewData(sampleData);
  }, [content, subject]);

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.substring(0, start) + `{{${variable}}}` + content.substring(end);
      setContent(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4);
      }, 0);
    }
  };

  const renderPreview = (text: string) => {
    let preview = text;
    Object.entries(previewData).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      preview = preview.replace(regex, value);
    });
    return preview;
  };

  const handleSave = () => {
    if (!name.trim() || !content.trim()) {
      alert('Please fill in the template name and content');
      return;
    }

    if ((type === 'email' || type === 'letter') && !subject.trim()) {
      alert('Please provide a subject line for email and letter templates');
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      type,
      subject: (type === 'email' || type === 'letter') ? subject.trim() : undefined,
      content: content.trim(),
      variables: detectedVariables,
      notify_template_id: notifyTemplateId.trim() || undefined
    });
  };

  const getTypeIcon = (templateType: string) => {
    switch (templateType) {
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      case 'letter': return FileText;
      default: return Mail;
    }
  };

  const TypeIcon = getTypeIcon(type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TypeIcon size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {template ? 'Edit Template' : 'Create Template'}
              </h2>
              <p className="text-sm text-gray-600">
                {template ? `Editing ${template.name}` : 'Create a new message template'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter template name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Template Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'email' | 'sms' | 'letter')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="letter">Letter</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this template"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {(type === 'email' || type === 'letter') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Subject Line *
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter subject line (you can use variables like {{first_name}})"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-900">
                    Template Content *
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPreviewMode(!previewMode)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${previewMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      <Eye size={16} className="inline mr-1" />
                      Preview
                    </button>
                    <button
                      onClick={() => setPreviewMode(false)}
                      className={`px-3 py-1 text-sm rounded-lg transition-colors ${!previewMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                      <Code size={16} className="inline mr-1" />
                      Edit
                    </button>
                  </div>
                </div>

                {previewMode ? (
                  <div className="border border-gray-300 rounded-lg p-4 min-h-[300px] bg-gray-50">
                    <div className="whitespace-pre-wrap text-gray-900">
                      {subject && (
                        <div className="mb-4 pb-2 border-b border-gray-300">
                          <strong>Subject: </strong>{renderPreview(subject)}
                        </div>
                      )}
                      {renderPreview(content)}
                    </div>
                  </div>
                ) : (
                  <textarea
                    id="template-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter your template content here. Use {{variableName}} for dynamic content."
                    className="w-full p-4 min-h-[300px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                )}

                <div className="mt-2 text-sm text-gray-600">
                  <p>Use double curly braces for variables: <code className="bg-gray-100 px-1 rounded">{'{{first_name}}'}</code></p>
                  {type === 'sms' && (
                    <p className="text-orange-600 mt-1">
                      <AlertCircle size={14} className="inline mr-1" />
                      SMS character limit: {content.length}/160 characters
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  GOV.UK Notify Template ID (Optional)
                </label>
                <input
                  type="text"
                  value={notifyTemplateId}
                  onChange={(e) => setNotifyTemplateId(e.target.value)}
                  placeholder="Link to existing GOV.UK Notify template"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If provided, this template will use the specified GOV.UK Notify template
                </p>
              </div>
            </div>

            {/* Variables Sidebar */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Variables</h3>

                {detectedVariables.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Detected Variables</h4>
                    <div className="space-y-2">
                      {detectedVariables.map((variable) => (
                        <div key={variable} className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                          <code className="text-sm text-green-800">{'{{' + variable + '}}'}</code>
                          <span className="text-xs text-green-600">✓</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Common Variables</h4>
                  <div className="space-y-1 max-h-60 overflow-y-auto">
                    {commonVariables.map((variable) => (
                      <button
                        key={variable}
                        onClick={() => insertVariable(variable)}
                        className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${detectedVariables.includes(variable)
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                      >
                        <Plus size={14} className="inline mr-2" />
                        {variable}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {previewMode && detectedVariables.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview Data</h4>
                  <div className="space-y-2 text-xs">
                    {detectedVariables.map((variable) => (
                      <div key={variable} className="flex justify-between">
                        <span className="text-gray-600">{variable}:</span>
                        <span className="text-gray-900 font-medium">{previewData[variable]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
            >
              <Save size={18} />
              {template ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
