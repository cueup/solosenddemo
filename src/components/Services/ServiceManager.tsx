import { useState, useEffect } from 'react';
import { X, Plus, Settings, Key, Eye, EyeOff, Trash2, Globe, TestTube, Power, PowerOff } from 'lucide-react';
import { useService } from '../../contexts/ServiceContext';
import { serviceService, ApiKey, Service } from '../../services/serviceService';

interface ServiceManagerProps {
  onClose: () => void;
  onServiceSelect: (service: Service) => void;
  currentService?: Service | null;
}

export function ServiceManager({ onClose, onServiceSelect, currentService }: ServiceManagerProps) {
  const { services, refreshServices } = useService();
  const [apiKeys, setApiKeys] = useState<Record<string, ApiKey[]>>({});
  const [loadingKeys, setLoadingKeys] = useState<Record<string, boolean>>({});

  const [showNewServiceForm, setShowNewServiceForm] = useState(false);
  const [showNewApiKeyForm, setShowNewApiKeyForm] = useState<string | null>(null);
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    apiKey: '',
    apiKeyName: 'Default API Key',
    apiKeyType: 'test' as 'test' | 'live'
  });
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '', type: 'test' as 'test' | 'live' });
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load API keys for all services
  useEffect(() => {
    const loadKeys = async () => {
      const keysMap: Record<string, ApiKey[]> = {};
      const loadingMap: Record<string, boolean> = {};

      for (const service of services) {
        loadingMap[service.id] = true;
      }
      setLoadingKeys(loadingMap);

      for (const service of services) {
        try {
          const keys = await serviceService.getApiKeys(service.id);
          keysMap[service.id] = keys;
        } catch (error) {
          console.error(`Error loading keys for service ${service.id}:`, error);
        } finally {
          setLoadingKeys(prev => ({ ...prev, [service.id]: false }));
        }
      }
      setApiKeys(keysMap);
    };

    if (services.length > 0) {
      loadKeys();
    }
  }, [services]);

  const handleCreateService = async () => {
    if (!newService.name.trim()) return;
    setIsSubmitting(true);

    try {
      const service = await serviceService.createService(newService.name, newService.description);

      if (newService.apiKey) {
        await serviceService.createApiKey(service.id, newService.apiKeyName, newService.apiKey, newService.apiKeyType);
      }

      await refreshServices();
      setNewService({
        name: '',
        description: '',
        apiKey: '',
        apiKeyName: 'Default API Key',
        apiKeyType: 'test'
      });
      setShowNewServiceForm(false);
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Failed to create service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateApiKey = async (serviceId: string) => {
    if (!newApiKey.name.trim()) return;
    setIsSubmitting(true);

    try {
      await serviceService.createApiKey(serviceId, newApiKey.name, newApiKey.key, newApiKey.type);
      // Refresh keys for this service
      const keys = await serviceService.getApiKeys(serviceId);
      setApiKeys(prev => ({ ...prev, [serviceId]: keys }));

      setNewApiKey({ name: '', key: '', type: 'test' });
      setShowNewApiKeyForm(null);
    } catch (error) {
      console.error('Error creating API key:', error);
      alert('Failed to create API key');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleApiKey = async (serviceId: string, apiKeyId: string, currentStatus: boolean) => {
    try {
      await serviceService.toggleApiKey(serviceId, apiKeyId, !currentStatus);
      // Refresh keys
      const keys = await serviceService.getApiKeys(serviceId);
      setApiKeys(prev => ({ ...prev, [serviceId]: keys }));
    } catch (error) {
      console.error('Error toggling API key:', error);
      alert('Failed to toggle API key');
    }
  };

  const handleDeleteApiKey = async (serviceId: string, apiKeyId: string) => {
    if (confirm('Are you sure you want to delete this API key?')) {
      try {
        await serviceService.deleteApiKey(apiKeyId);
        // Refresh keys
        const keys = await serviceService.getApiKeys(serviceId);
        setApiKeys(prev => ({ ...prev, [serviceId]: keys }));
      } catch (error) {
        console.error('Error deleting API key:', error);
        alert('Failed to delete API key');
      }
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Are you sure you want to delete this service? This will also delete all associated API keys.')) {
      try {
        await serviceService.deleteService(serviceId);
        await refreshServices();
        if (currentService?.id === serviceId) {
          onServiceSelect(null as any); // Clear selection if deleted
        }
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service');
      }
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
    if (!key) return '....................';
    if (key.length <= 8) return key;
    return key.substring(0, 8) + '•'.repeat(Math.max(0, key.length - 12)) + key.substring(key.length - 4);
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
              disabled={isSubmitting}
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

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <h5 className="text-sm font-medium text-gray-900 mb-3">Initial API Key (Mandatory)</h5>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                      <input
                        type="text"
                        value={newService.apiKeyName}
                        onChange={(e) => setNewService({ ...newService, apiKeyName: e.target.value })}
                        placeholder="e.g. Default API Key"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      <input
                        type="text"
                        value={newService.apiKey}
                        onChange={(e) => setNewService({ ...newService, apiKey: e.target.value })}
                        placeholder="Paste your GOV.UK Notify API key here"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                      <select
                        value={newService.apiKeyType}
                        onChange={(e) => setNewService({ ...newService, apiKeyType: e.target.value as 'test' | 'live' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="test">Test</option>
                        <option value="live">Live</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCreateService}
                    disabled={isSubmitting || !newService.name.trim() || !newService.apiKey.trim()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Service'}
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
                      <p className="text-sm text-gray-600 mt-1">
                        Created {formatDate(service.created_at)}
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
                    <h5 className="font-medium text-gray-900">
                      API Keys ({apiKeys[service.id]?.length || 0})
                    </h5>
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
                            disabled={isSubmitting || !newApiKey.name.trim() || !newApiKey.key.trim()}
                            className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
                          >
                            {isSubmitting ? 'Adding...' : 'Add Key'}
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

                  {loadingKeys[service.id] ? (
                    <div className="text-center py-4 text-gray-500">Loading keys...</div>
                  ) : !apiKeys[service.id] || apiKeys[service.id].length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Key size={32} className="mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No API keys configured</p>
                      <p className="text-xs text-gray-400">Add an API key to start sending messages</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {apiKeys[service.id].map((apiKey) => (
                        <div
                          key={apiKey.id}
                          className={`border rounded-lg p-3 ${apiKey.is_active
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{apiKey.name}</span>
                                <span className={`text-xs font-medium px-2 py-1 rounded ${(apiKey.permissions && apiKey.permissions.includes('live')) || apiKey.type === 'live'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                  {(apiKey.permissions && apiKey.permissions.includes('live')) || apiKey.type === 'live' ? (
                                    <><Globe size={12} className="inline mr-1" />Live</>
                                  ) : (
                                    <><TestTube size={12} className="inline mr-1" />Test</>
                                  )}
                                </span>
                                {apiKey.is_active && (
                                  <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <code className="bg-white px-2 py-1 rounded border text-xs">
                                  {visibleKeys.has(apiKey.id) ? apiKey.key_hash : maskApiKey(apiKey.key_hash)}
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
                                onClick={() => handleToggleApiKey(service.id, apiKey.id, apiKey.is_active)}
                                className={`p-2 rounded-lg transition-colors ${apiKey.is_active
                                  ? 'hover:bg-red-100 text-red-600'
                                  : 'hover:bg-green-100 text-green-600'
                                  }`}
                                title={apiKey.is_active ? 'Deactivate key' : 'Activate key'}
                              >
                                {apiKey.is_active ? (
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
      </div >
    </div >
  );
}