import { Mail, MessageSquare, FileText, Edit, Trash2 } from 'lucide-react';
import { Template } from '../../services/templateService';

export function TemplateRow({ template, onEdit, onDelete }: {
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

    if (diffTime < 24 * 60 * 60 * 1000) return `${Math.ceil(diffTime / (1000 * 60 * 60))} hours ago`;
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
