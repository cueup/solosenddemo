import { useState, useEffect } from 'react';
import { X, Plus, Filter, Users, MapPin, Tag, Mail, Phone, Edit3, Trash2, Save, AlertCircle, CheckSquare } from 'lucide-react';
import { segmentService, Segment, SegmentFilter } from '../../services/segmentService';
import { contactPreferenceService, ContactPreferences } from '../../services/contactPreferenceService';

import { contactService, Contact } from '../../services/contactService';

interface SegmentManagerProps {
  contacts: Contact[];
  onClose: () => void;
  onSegmentCreated: (segment: Segment) => void;
}

export function SegmentManager({ contacts, onClose, onSegmentCreated }: SegmentManagerProps) {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [contactPreferences, setContactPreferences] = useState<Record<string, ContactPreferences>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);

  useEffect(() => {
    loadData();
  }, [contacts]);

  const loadData = async () => {
    if (contacts.length === 0) {
      setLoading(false);
      return;
    }

    try {
      const serviceId = contacts[0].service_id;
      const [fetchedSegments, fetchedPreferences] = await Promise.all([
        segmentService.getSegments(serviceId),
        contactPreferenceService.getPreferencesForContacts(contacts.map(c => c.id))
      ]);

      // Calculate contact counts for segments
      const segmentsWithCounts = fetchedSegments.map(segment => ({
        ...segment,
        contactCount: getMatchingContactsCount(segment.filters, contacts, fetchedPreferences)
      }));

      setSegments(segmentsWithCounts);
      setContactPreferences(fetchedPreferences);
    } catch (error) {
      console.error('Error loading segment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMatchingContactsCount = (filters: SegmentFilter[], contactsList: Contact[], preferences: Record<string, ContactPreferences>) => {
    return segmentService.getMatchingContacts(filters, contactsList, preferences).length;
  };

  const handleCreateSegment = async (segmentData: Omit<Segment, 'id' | 'contactCount' | 'created_at' | 'updated_at' | 'service_id'>) => {
    try {
      const newSegment = await segmentService.createSegment({
        ...segmentData,
        service_id: contacts[0].service_id
      });

      const segmentWithCount = {
        ...newSegment,
        contactCount: getMatchingContactsCount(newSegment.filters, contacts, contactPreferences)
      };

      setSegments([segmentWithCount, ...segments]);
      onSegmentCreated(newSegment);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating segment:', error);
      alert('Failed to create segment');
    }
  };

  const handleUpdateSegment = async (segmentData: Omit<Segment, 'id' | 'contactCount' | 'created_at' | 'updated_at' | 'service_id'>) => {
    if (!editingSegment) return;

    try {
      const updatedSegment = await segmentService.updateSegment(editingSegment.id, segmentData);

      const segmentWithCount = {
        ...updatedSegment,
        contactCount: getMatchingContactsCount(updatedSegment.filters, contacts, contactPreferences)
      };

      setSegments(segments.map(s => s.id === editingSegment.id ? segmentWithCount : s));
      setEditingSegment(null);
      if (selectedSegment?.id === editingSegment.id) {
        setSelectedSegment(segmentWithCount);
      }
    } catch (error) {
      console.error('Error updating segment:', error);
      alert('Failed to update segment');
    }
  };

  const handleDeleteSegment = async (segmentId: string) => {
    if (confirm('Are you sure you want to delete this segment?')) {
      try {
        await segmentService.deleteSegment(segmentId);
        setSegments(segments.filter(s => s.id !== segmentId));
        if (selectedSegment?.id === segmentId) {
          setSelectedSegment(null);
        }
      } catch (error) {
        console.error('Error deleting segment:', error);
        alert('Failed to delete segment');
      }
    }
  };

  const getMatchingContacts = (filters: SegmentFilter[], contactsList: Contact[] = contacts, preferences: Record<string, ContactPreferences> = contactPreferences): Contact[] => {
    return segmentService.getMatchingContacts(filters, contactsList, preferences);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading segments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Filter size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Contact Segments</h2>
              <p className="text-gray-600">Create and manage contact segments based on filters</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Plus size={18} />
              Create Segment
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Segments List */}
          <div className="w-1/2 border-r border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Your Segments ({segments.length})</h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {segments.map((segment) => (
                <div
                  key={segment.id}
                  className={`p-4 border-b border-gray-200 cursor-pointer transition-colors ${selectedSegment?.id === segment.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  onClick={() => setSelectedSegment(segment)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{segment.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{segment.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users size={12} />
                          <span>{segment.contactCount} contacts</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Filter size={12} />
                          <span>{segment.filters.length} filter{segment.filters.length !== 1 ? 's' : ''}</span>
                        </div>
                        <span>Updated {formatDate(segment.updated_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSegment(segment);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Edit segment"
                      >
                        <Edit3 size={14} className="text-gray-600" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSegment(segment.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Delete segment"
                      >
                        <Trash2 size={14} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {segments.length === 0 && (
                <div className="p-8 text-center">
                  <Filter size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No segments created yet</p>
                  <p className="text-sm text-gray-400 mt-1">Create your first segment to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Segment Details / Preview */}
          <div className="w-1/2 flex flex-col">
            {selectedSegment ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">{selectedSegment.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{selectedSegment.description}</p>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900">Filters:</h4>
                    {selectedSegment.filters.map((filter, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        {index > 0 && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">
                            {selectedSegment.filters[index - 1]?.logic || 'AND'}
                          </span>
                        )}
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium capitalize">
                          {filter.field.replace('_', ' ')}
                        </span>
                        <span className="text-gray-500 text-xs">{filter.operator.replace('_', ' ')}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                          "{filter.value}"
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Matching Contacts ({selectedSegment.contactCount})
                  </h4>

                  <div className="space-y-3">
                    {getMatchingContacts(selectedSegment.filters).map((contact, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-semibold text-sm">
                              {contact.first_name[0]}{contact.last_name[0]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 text-sm">{contact.title} {contact.first_name} {contact.last_name}</h5>
                            <div className="space-y-1 mt-1">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Mail size={12} />
                                <span className="truncate">{contact.email}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Phone size={12} />
                                <span>{contact.phone}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <MapPin size={12} />
                                <span className="truncate">{contact.address_line_1}, {contact.postcode}</span>
                              </div>
                              {(contact.tags || []).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {(contact.tags || []).map((tag, tagIndex) => (
                                    <span key={tagIndex} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                      <Tag size={10} />
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {contactPreferences[contact.id] && (
                                <div className="flex gap-2 mt-2 pt-2 border-t border-gray-200">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${contactPreferences[contact.id].email ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    Email: {contactPreferences[contact.id].email ? 'Yes' : 'No'}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${contactPreferences[contact.id].sms ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    SMS: {contactPreferences[contact.id].sms ? 'Yes' : 'No'}
                                  </span>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${contactPreferences[contact.id].letter ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    Letter: {contactPreferences[contact.id].letter ? 'Yes' : 'No'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">Select a segment to view details</p>
                  <p className="text-sm text-gray-400 mt-1">Choose a segment from the list to see matching contacts</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Segment Form */}
        {(showCreateForm || editingSegment) && (
          <SegmentForm
            segment={editingSegment}
            contacts={contacts}
            preferences={contactPreferences}
            onSave={editingSegment ? handleUpdateSegment : handleCreateSegment}
            onCancel={() => {
              setShowCreateForm(false);
              setEditingSegment(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

function SegmentForm({ segment, contacts, preferences, onSave, onCancel }: {
  segment?: Segment | null;
  contacts: Contact[];
  preferences: Record<string, ContactPreferences>;
  onSave: (segmentData: Omit<Segment, 'id' | 'contactCount' | 'created_at' | 'updated_at' | 'service_id'>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(segment?.name || '');
  const [description, setDescription] = useState(segment?.description || '');
  const [filters, setFilters] = useState<SegmentFilter[]>(segment?.filters || [
    { field: 'tags', operator: 'contains', value: '' }
  ]);

  const fieldOptions = [
    { value: 'tags', label: 'Tags', icon: Tag },
    { value: 'address', label: 'Address', icon: MapPin },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'phone', label: 'Phone', icon: Phone },
    { value: 'name', label: 'Name', icon: Users },
    { value: 'email_preference', label: 'Email Preference', icon: CheckSquare },
    { value: 'sms_preference', label: 'SMS Preference', icon: CheckSquare },
    { value: 'letter_preference', label: 'Letter Preference', icon: CheckSquare }
  ];

  const operatorOptions = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'not_contains', label: 'Does not contain' }
  ];

  const addFilter = () => {
    setFilters([...filters, { field: 'tags', operator: 'contains', value: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, updates: Partial<SegmentFilter>) => {
    setFilters(filters.map((filter, i) =>
      i === index ? { ...filter, ...updates } : filter
    ));
  };

  const getPreviewCount = () => {
    const validFilters = filters.filter(f => f.value.trim());
    if (validFilters.length === 0) return 0;

    return segmentService.getMatchingContacts(validFilters, contacts, preferences).length;
  };



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validFilters = filters.filter(f => f.value.trim());

    if (!name.trim() || validFilters.length === 0) return;

    onSave({
      name: name.trim(),
      description: description.trim(),
      filters: validFilters
    });
  };

  const previewCount = getPreviewCount();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            {segment ? 'Edit Segment' : 'Create New Segment'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Segment Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., VIP Customers, London Residents"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Describe what this segment is for..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-semibold text-gray-900">
                Filters *
              </label>
              <button
                type="button"
                onClick={addFilter}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                <Plus size={16} />
                Add Filter
              </button>
            </div>

            <div className="space-y-4">
              {filters.map((filter, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  {index > 0 && (
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Logic</label>
                      <select
                        value={filters[index - 1]?.logic || 'AND'}
                        onChange={(e) => updateFilter(index - 1, { logic: e.target.value as 'AND' | 'OR' })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">Field</label>
                      <select
                        value={filter.field}
                        onChange={(e) => updateFilter(index, { field: e.target.value as SegmentFilter['field'], value: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        {fieldOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {['email_preference', 'sms_preference', 'letter_preference'].includes(filter.field) ? (
                      <>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Value</label>
                          <div className="flex gap-2">
                            <select
                              value={filter.value}
                              onChange={(e) => updateFilter(index, { value: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                              <option value="">Select...</option>
                              <option value="true">Opted In (True)</option>
                              <option value="false">Opted Out (False)</option>
                            </select>
                            {filters.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeFilter(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">Operator</label>
                          <select
                            value={filter.operator}
                            onChange={(e) => updateFilter(index, { operator: e.target.value as SegmentFilter['operator'] })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          >
                            {operatorOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-2">Value</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={filter.value}
                              onChange={(e) => updateFilter(index, { value: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              placeholder="Enter value..."
                            />
                            {filters.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeFilter(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">Preview</h4>
                <p className="text-blue-800 text-sm mt-1">
                  This segment will match <strong>{previewCount}</strong> contact{previewCount !== 1 ? 's' : ''} from your current list.
                </p>
                {previewCount === 0 && filters.some(f => f.value.trim()) && (
                  <div className="flex items-center gap-2 mt-2 text-amber-700">
                    <AlertCircle size={16} />
                    <span className="text-sm">No contacts match these filters. Consider adjusting your criteria.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || !filters.some(f => f.value.trim())}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={18} />
              {segment ? 'Update Segment' : 'Create Segment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
