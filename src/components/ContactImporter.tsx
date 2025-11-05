import { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle2, FileText, Users } from 'lucide-react';

interface Contact {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  postcode: string;
  tags: string[];
}

interface ContactImporterProps {
  onClose: () => void;
  onImport: (contacts: Contact[]) => void;
}

export function ContactImporter({ onClose, onImport }: ContactImporterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parseError, setParseError] = useState('');
  const [parsedContacts, setParsedContacts] = useState<Contact[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const csvTemplate = `title,firstName,lastName,email,phone,address1,address2,city,postcode,tags
Mr,John,Smith,john.smith@example.com,+44 20 7123 4567,123 High Street,Apartment 4B,London,SW1A 1AA,"VIP,Government"
Mrs,Sarah,Johnson,sarah.johnson@example.com,+44 20 7234 5678,456 Park Road,,Manchester,M1 1AA,"Citizens"
Dr,Michael,Brown,michael.brown@example.com,+44 20 7345 6789,789 Queen Avenue,Suite 12,Birmingham,B1 1AA,"Business,VIP"`;

  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (selectedFile: File) => {
    setParseError('');
    setParsedContacts([]);

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setParseError('Please select a CSV file');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
      setParseError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const text = await selectedFile.text();
      const contacts = parseCSV(text);
      setParsedContacts(contacts);
    } catch (error) {
      setParseError('Failed to read the CSV file. Please check the file format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseCSV = (csvText: string): Contact[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV file must contain at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const requiredHeaders = ['title', 'firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'postcode'];
    
    // Check for required headers
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.some(h => h.toLowerCase() === header.toLowerCase())
    );
    
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(', ')}`);
    }

    const contacts: Contact[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
          errors.push(`Row ${i + 1}: Column count mismatch`);
          continue;
        }

        const contact: any = {};
        headers.forEach((header, index) => {
          contact[header.toLowerCase()] = values[index]?.trim() || '';
        });

        // Validate required fields
        const requiredFields = ['title', 'firstName', 'lastName', 'email', 'phone', 'address1', 'city', 'postcode'];
        const missingFields = requiredFields.filter(field => !contact[field]);
        
        if (missingFields.length > 0) {
          errors.push(`Row ${i + 1}: Missing required fields: ${missingFields.join(', ')}`);
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(contact.email)) {
          errors.push(`Row ${i + 1}: Invalid email format`);
          continue;
        }

        // Parse tags
        let tags: string[] = [];
        if (contact.tags) {
          tags = contact.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag);
        }

        contacts.push({
          title: contact.title,
          firstName: contact.firstname || contact.firstName,
          lastName: contact.lastname || contact.lastName,
          email: contact.email,
          phone: contact.phone,
          address1: contact.address1,
          address2: contact.address2 || '',
          city: contact.city,
          postcode: contact.postcode,
          tags
        });
      } catch (error) {
        errors.push(`Row ${i + 1}: Failed to parse row`);
      }
    }

    if (errors.length > 0 && contacts.length === 0) {
      throw new Error(`Failed to parse CSV:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? '\n...' : ''}`);
    }

    if (errors.length > 0) {
      console.warn('CSV parsing warnings:', errors);
    }

    return contacts;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  };

  const handleImport = () => {
    if (parsedContacts.length > 0) {
      onImport(parsedContacts);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Upload size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Import Contacts</h2>
              <p className="text-sm text-gray-600">Upload a CSV file to import multiple contacts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Download Template Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Need a template?</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Download our CSV template with the correct format and example data to get started.
                </p>
                <button
                  onClick={downloadTemplate}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Template
                </button>
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Upload CSV File
            </label>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
              />
              
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              
              {file ? (
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024).toFixed(1)} KB • {file.type}
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Choose different file
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    Drop your CSV file here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-600">Maximum file size: 5MB</p>
                </div>
              )}
            </div>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Processing CSV file...</span>
            </div>
          )}

          {/* Error Display */}
          {parseError && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">Import Error</h4>
                <p className="text-sm text-red-800 whitespace-pre-line">{parseError}</p>
              </div>
            </div>
          )}

          {/* Success Display */}
          {parsedContacts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle2 size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">CSV Parsed Successfully</h4>
                  <p className="text-sm text-green-800">
                    Found {parsedContacts.length} valid contact{parsedContacts.length !== 1 ? 's' : ''} ready to import.
                  </p>
                </div>
              </div>

              {/* Preview */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Preview (first 5 contacts)</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4 text-xs font-medium text-gray-700">
                      <span>Name</span>
                      <span>Email</span>
                      <span>Phone</span>
                      <span>Tags</span>
                    </div>
                  </div>
                  <div className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
                    {parsedContacts.slice(0, 5).map((contact, index) => (
                      <div key={index} className="px-4 py-3">
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <span className="font-medium text-gray-900">
                            {contact.title} {contact.firstName} {contact.lastName}
                          </span>
                          <span className="text-gray-600 truncate">{contact.email}</span>
                          <span className="text-gray-600">{contact.phone}</span>
                          <div className="flex flex-wrap gap-1">
                            {contact.tags.slice(0, 2).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {contact.tags.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{contact.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {parsedContacts.length > 5 && (
                    <div className="bg-gray-50 px-4 py-2 border-t border-gray-200 text-center">
                      <span className="text-sm text-gray-600">
                        ... and {parsedContacts.length - 5} more contacts
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CSV Format Requirements */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">CSV Format Requirements</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>Required columns:</strong> title, firstName, lastName, email, phone, address1, city, postcode</p>
              <p><strong>Optional columns:</strong> address2, tags</p>
              <p><strong>Tags format:</strong> Separate multiple tags with commas (e.g., "VIP,Government")</p>
              <p><strong>File encoding:</strong> UTF-8 recommended</p>
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
              onClick={handleImport}
              disabled={parsedContacts.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Users size={18} />
              Import {parsedContacts.length} Contact{parsedContacts.length !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
