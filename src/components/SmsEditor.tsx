import { useState, useEffect } from 'react';
import { X, AlertCircle, Calendar, Clock, Maximize2, Minimize2 } from 'lucide-react';

interface SmsEditorProps {
  onClose: () => void;
}

export function SmsEditor({ onClose }: SmsEditorProps) {
  const [content, setContent] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [hasSpecialChars, setHasSpecialChars] = useState(false);
  const [charLimit, setCharLimit] = useState(160);
  const [scheduleMode, setScheduleMode] = useState<'now' | 'scheduled'>('now');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl w-full overflow-hidden flex flex-col transition-all ${
        isFullScreen ? 'max-w-full h-full m-0' : 'max-w-2xl max-h-[90vh]'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Send Text Message</h2>
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
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Recipients
            </label>
            <input
              type="text"
              placeholder="Select contacts or enter phone numbers"
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
              {scheduleMode === 'now' ? 'Send Message' : 'Schedule Message'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
