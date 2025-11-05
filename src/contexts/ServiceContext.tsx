import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

interface ServiceContextType {
  currentService: Service | null;
  setCurrentService: (service: Service | null) => void;
  activeApiKey: ApiKey | null;
  isLoading: boolean;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get the active API key from the current service
  const activeApiKey = currentService?.apiKeys.find(key => key.isActive) || null;

  useEffect(() => {
    // Load the last selected service from localStorage
    const savedServiceId = localStorage.getItem('currentServiceId');
    if (savedServiceId) {
      // In a real app, you'd fetch the service from your backend
      // For now, we'll use mock data
      const mockService: Service = {
        id: savedServiceId,
        name: 'Department for Work and Pensions',
        description: 'Main service for DWP communications',
        apiKeys: [
          {
            id: '1',
            name: 'Production API',
            key: 'dwp-live-12345678-1234-1234-1234-123456789012',
            type: 'live',
            isActive: true,
            created_at: '2024-01-15T10:00:00Z',
            last_used: '2024-10-31T09:30:00Z'
          }
        ],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-10-31T09:30:00Z'
      };
      setCurrentService(mockService);
    }
    setIsLoading(false);
  }, []);

  const handleSetCurrentService = (service: Service | null) => {
    setCurrentService(service);
    if (service) {
      localStorage.setItem('currentServiceId', service.id);
    } else {
      localStorage.removeItem('currentServiceId');
    }
  };

  return (
    <ServiceContext.Provider
      value={{
        currentService,
        setCurrentService: handleSetCurrentService,
        activeApiKey,
        isLoading
      }}
    >
      {children}
    </ServiceContext.Provider>
  );
}

export function useService() {
  const context = useContext(ServiceContext);
  if (context === undefined) {
    throw new Error('useService must be used within a ServiceProvider');
  }
  return context;
}