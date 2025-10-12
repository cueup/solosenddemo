import { useState } from 'react';
import {
  List,
  ListOrdered,
  Heading1,
  Heading2,
  FileText,
  X,
  Calendar,
  Clock,
  Upload,
  Paperclip,
  AlertCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface LetterEditorProps {
  onClose: () => void;
}

export function LetterEditor({ onClose }: LetterEditorProps) {
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [attachedPdf, setAttachedPdf] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPdfError('');

    if (file.type !== 'application/pdf') {
      setPdfError('Only PDF files are allowed');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPdfError('PDF file must be smaller than 2MB');
      return;
    }

    setAttachedPdf(file);
  };

  const removePdf = () => {
    setAttachedPdf(null);
    setPdfError('');
    const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const insertFormatting = (before: string, after: string = '') => {
    const textarea = document.getElementById('letter-content') as HTMLTextAreaElement;
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
          <h2 className="text-2xl font-bold text-gray-900">Create Letter</h2>
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
              placeholder="Enter letter subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Letter Content
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
                  onClick={() => insertFormatting('\n---PAGE BREAK---\n')}
                  className="p-2 hover:bg-gray-200 rounded transition-colors"
                  title="Page break"
                >
                  <FileText size={18} />
                </button>
              </div>

              <textarea
                id="letter-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your letter content here...&#10;&#10;Formatting options:&#10;# Heading 1&#10;## Heading 2&#10;* Bullet point&#10;1. Numbered list&#10;---PAGE BREAK--- Insert page break"
                className="w-full p-4 min-h-[400px] focus:outline-none resize-none font-serif"
              />
            </div>

            <div className="mt-2 text-sm text-gray-600">
              <p className="font-medium mb-1">Available formatting:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Bullet points</li>
                <li>Headings</li>
                <li>Numbered steps</li>
                <li>Page breaks</li>
              </ul>
              <p className="mt-2 text-xs text-gray-500">
                Note: Bold, italics, underlined text, and different fonts are not supported for accessibility reasons.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Postage Type
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>First Class</option>
                <option>Second Class</option>
                <option>International</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Recipients
              </label>
              <input
                type="text"
                placeholder="Select contacts"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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
                    <p className="text-xs text-gray-500">Letter will be processed immediately</p>
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

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Attach PDF (Optional)
            </label>
            <div className="space-y-3">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                <input
                  type="file"
                  id="pdf-upload"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-900 mb-1">Upload a PDF to include with your letter</p>
                  <p className="text-xs text-gray-500">Maximum file size: 2MB</p>
                </label>
              </div>

              {pdfError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{pdfError}</p>
                </div>
              )}

              {attachedPdf && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Paperclip size={18} className="text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-900">{attachedPdf.name}</p>
                      <p className="text-xs text-green-700">{(attachedPdf.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={removePdf}
                    className="p-1 hover:bg-green-100 rounded transition-colors"
                    title="Remove PDF"
                  >
                    <X size={16} className="text-green-600" />
                  </button>
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              The PDF will be printed and included with your letter. All pages will be printed in black and white.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">GOV.UK Notify will print and post your letters.</span> Letters are printed in black and white, double-sided on A4 paper. First class letters are dispatched the next working day. Second class letters are dispatched within 2 working days.
            </p>
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
              {scheduleMode === 'now' ? 'Send Letter' : 'Schedule Letter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
