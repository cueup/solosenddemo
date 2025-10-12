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
  Minimize2
} from 'lucide-react';

interface EmailEditorProps {
  onClose: () => void;
}

export function EmailEditor({ onClose }: EmailEditorProps) {
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full overflow-hidden flex flex-col transition-all ${
        isFullScreen ? 'max-w-full h-full m-0' : 'max-w-4xl max-h-[90vh]'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create Email</h2>
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Recipients
            </label>
            <input
              type="text"
              placeholder="Select contacts or enter email addresses"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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

        <div className="border-t border-gray-200 p-6 flex justify-between items-center bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium">
              Save Draft
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              {scheduleMode === 'now' ? 'Send Email' : 'Schedule Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
