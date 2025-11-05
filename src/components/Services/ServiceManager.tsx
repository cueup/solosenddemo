import { useState } from 'react';
import { X, Plus, Settings, Key, Eye, EyeOff, Edit, Trash2, Globe, TestTube, Power, PowerOff } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  type: 'test' | 'live';
  isActive: boolean;
  created_at: string;
  last_used?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  apiKeys: ApiKey[];
  created_at: string;
  updated_at: string;
}

interface ServiceManagerProps {
  onClose: () => void;
  onServiceSelect: (service: Service) => void;
  currentService?: Service | null;
}

export function ServiceManager({ onClose, onServiceSelect, currentService }: ServiceManagerProps) {
  const [services, setServices] = useState<Service[]>([
    {
      id: '1',
      name: 'Department for Work and Pensions',
      description: 'Main service for DWP communications including benefit notifications and updates',
      apiKeys: [
        {
          id: '1',
          name: 'Production API',
          key: 'dwp-live-12345678-1234-1234-1234-123456789012',
          type: 'live',
          isActive: true,
          created_at: '2024-01-15T10:00:00Z',
          last_used: '2024-10-31T09:30:00Z'
        },
        {
          id: '2',
          name: 'Testing API',
          key: 'dwp-test-87654321-4321-4321-4321-210987654321',
          type: 'test',
          isActive: false,
          created_at: '2024-01-15T10:05:00Z',
          last_used: '2024-10-30T14:20:00Z'
        }
      ],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-10-31T09:30:00Z'
    },
    {
      id: '2',
      name: 'HM Revenue & Customs',
      description: 'HMRC service for tax-related communications and reminders',
      apiKeys: [
        {
          id: '3',
          name: 'HMRC Live',
          key: 'hmrc-live-11111111-2222-3333-4444-555555555555',
          type: 'live',
          isActive: false,
          created_at: '2024-02-01T09:00:00Z',
          last_used: '2024-10-29T16:45:00Z'
        },
        {
          id: '4',
          name: 'HMRC Test Environment',
          key: 'hmrc-test-99999999-8888-7777-6666-555555555555',
          type: 'test',
          isActive: true,
          created_at: '2024-02-01T09:05:00Z',
          last_used: '2024-10-31T11:15:00Z'
        }
      ],
      created_at: '2024-02-01T09:00:00Z',
      updated_at: '2024-10-29T16:45:00Z'
    }
  ]);

  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [showNewApiKeyForm, setShowNewApiKeyForm] = useState<string | null>(null);
  const [newService, setNewService] = useState({ name: '', description: '' });
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '', type: 'test' as 'test' | 'live' });
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const handleCreateService = () => {
    if (!newService.name.trim()) return;

    const service: Service = {
      id: Date.now().toString(),
      name: newService.name,
      description: newService.description,
      apiKeys: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setServices([...services, service]);
    setNewService({ name: '', description: '' });
    setShowNewServiceForm(false);
  };

  const handleCreateApiKey = (serviceId: string) => {
    if (!newApiKey.name.trim() || !newApiKey.key.trim()) return;

    const apiKey: ApiKey = {
      id: Date.now().toString(),
      name: newApiKey.name,
      key: newApiKey.key,
      type: newApiKey.type,
      isActive: false,
      created_at: new Date().toISOString()
    };

    setServices(services.map(service => 
      service.id === serviceId 
        ? { ...service, apiKeys: [...service.apiKeys, apiKey], updated_at: new Date().toISOString() }
        : service
    ));

    setNewApiKey({ name: '', key: '', type: 'test' });
    setShowNewApiKeyForm(null);
  };

  const handleToggleApiKey = (serviceId: string, apiKeyId: string) => {
    setServices(services.map(service => 
      service.id === serviceId 
        ? {
            ...service,
            apiKeys: service.apiKeys.map(key => ({
              ...key,
              isActive: key.id === apiKeyId ? !key.isActive : false // Only one can be active
            })),
            updated_at: new Date().toISOString()
          }
        : service
    ));
  };

  const handleDeleteApiKey = (serviceId: string, apiKeyId: string) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      setServices(services.map(service => 
        service.id === serviceId 
          ? { 
              ...service, 
              apiKeys: service.apiKeys.filter(key => key.id !== apiKeyId),
              updated_at: new Date().toISOString()
            }
          : service
      ));
    }
  };

  const handleDeleteService = (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service? This will also delete all associated API keys.')) {
      setServices(services.filter(service => service.id !== serviceId));
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    const newVisible = new Set(visibleKeys);
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId);
    } else {
      newVisible.add(keyId);
    }
    setVisibleKeys(newVisible);
  };

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '•'.repeat(key.length - 12) + key.substring(key.length - 4);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Service Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage your GOV.UK Notify services and API keys</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Your Services</h3>
            <button
              onClick={() => setShowNewServiceForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add Service
            </button>
          </div>

          {showNewServiceForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">Create New Service</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    placeholder="e.g. Department for Work and Pensions"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    placeholder="Brief description of this service"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateService}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Service
                  </button>
                  <button
                    onClick={() => setShowNewServiceForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold text-gray-900">{service.name}</h4>
                        {currentService?.id === service.id && (
                          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                            Current Service
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Created {formatDate(service.created_at)} • Last updated {formatDate(service.updated_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onServiceSelect(service)}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        Switch to Service
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                        title="Delete service"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-gray-900">API Keys ({service.apiKeys.length})</h5>
                    <button
                      onClick={() => setShowNewApiKeyForm(service.id)}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors flex items-center gap-1"
                    >
                      <Plus size={14} />
                      Add API Key
                    </button>
                  </div>

                  {showNewApiKeyForm === service.id && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <h6 className="font-medium text-blue-900 mb-3">Add New API Key</h6>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-1">Key Name</label>
                          <input
                            type="text"
                            value={newApiKey.name}
                            onChange={(e) => setNewApiKey({ ...newApiKey, name: e.target.value })}
                            placeholder="e.g. Production API"
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-1">API Key</label>
                          <input
                            type="text"
                            value={newApiKey.key}
                            onChange={(e) => setNewApiKey({ ...newApiKey, key: e.target.value })}
                            placeholder="Paste your GOV.UK Notify API key here"
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-1">Environment</label>
                          <select
                            value={newApiKey.type}
                            onChange={(e) => setNewApiKey({ ...newApiKey, type: e.target.value as 'test' | 'live' })}
                            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="test">Test</option>
                            <option value="live">Live</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCreateApiKey(service.id)}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Add Key
                          </button>
                          <button
                            onClick={() => setShowNewApiKeyForm(null)}
                            className="bg-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-400 transition-colors text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {service.apiKeys.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Key size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No API keys configured</p>
                      <p className="text-xs text-gray-400">Add an API key to start sending messages</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {service.apiKeys.map((apiKey) => (
                        <div
                          key={apiKey.id}
                          className={`border rounded-lg p-3 ${
                            apiKey.isActive 
                              ? 'border-green-200 bg-green-50' 
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{apiKey.name}</span>
                                <span className={`text-xs font-medium px-2 py-1 rounded ${
                                  apiKey.type === 'live' 
                                    ? 'bg-red-100 text-red-700' 
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {apiKey.type === 'live' ? (
                                    <><Globe size={12} className="inline mr-1" />Live</>
                                  ) : (
                                    <><TestTube size={12} className="inline mr-1" />Test</>
                                  )}
                                </span>
                                {apiKey.isActive && (
                                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <code className="bg-white px-2 py-1 rounded border text-xs">
                                  {visibleKeys.has(apiKey.id) ? apiKey.key : maskApiKey(apiKey.key)}
                                </code>
                                <button
                                  onClick={() => toggleKeyVisibility(apiKey.id)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  title={visibleKeys.has(apiKey.id) ? 'Hide key' : 'Show key'}
                                >
                                  {visibleKeys.has(apiKey.id) ? (
                                    <EyeOff size={14} />
                                  ) : (
                                    <Eye size={14} />
                                  )}
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Created {formatDate(apiKey.created_at)}
                                {apiKey.last_used && ` • Last used ${formatDate(apiKey.last_used)}`}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleApiKey(service.id, apiKey.id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  apiKey.isActive
                                    ? 'hover:bg-red-100 text-red-600'
                                    : 'hover:bg-green-100 text-green-600'
                                }`}
                                title={apiKey.isActive ? 'Deactivate key' : 'Activate key'}
                              >
                                {apiKey.isActive ? (
                                  <PowerOff size={16} />
                                ) : (
                                  <Power size={16} />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteApiKey(service.id, apiKey.id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Delete API key"
                              >
                                <Trash2 size={16} className="text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center py-12">
              <Settings size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No services configured</p>
              <p className="text-sm text-gray-400 mt-1">Create your first service to get started</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}