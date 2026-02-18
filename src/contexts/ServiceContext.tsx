import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { serviceService, Service, ApiKey } from '../services/serviceService';
import { useAuth } from './AuthContext';

interface ServiceContextType {
  currentService: Service | null;
  setCurrentService: (service: Service | null) => void;
  services: Service[];
  refreshServices: () => Promise<void>;
  activeApiKey: ApiKey | null;
  isLoading: boolean;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

export function ServiceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentService, setCurrentService] = useState<Service | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [activeApiKey, setActiveApiKey] = useState<ApiKey | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshServices = async () => {
    if (!user) {
      setServices([]);
      setCurrentService(null);
      return;
    }

    try {
      const data = await serviceService.getServices();
      setServices(data);

      // If we have a current service, make sure it's still in the list
      if (currentService) {
        const stillExists = data.find(s => s.id === currentService.id);
        if (!stillExists) {
          setCurrentService(data.length > 0 ? data[0] : null);
        } else {
          // Update current service with latest data
          setCurrentService(stillExists);
        }
      } else if (data.length > 0) {
        // If no service selected but we have some, select the first one
        // Check local storage first
        const savedServiceId = localStorage.getItem('currentServiceId');
        const savedService = data.find(s => s.id === savedServiceId);
        setCurrentService(savedService || data[0]);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  // Load services when user changes
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setIsLoading(true);
      await refreshServices();
      if (mounted) setIsLoading(false);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user]);

  // Update active API key when service changes
  useEffect(() => {
    const loadApiKey = async () => {
      if (!currentService) {
        setActiveApiKey(null);
        return;
      }

      try {
        const keys = await serviceService.getApiKeys(currentService.id);
        const active = keys.find(k => k.is_active);
        setActiveApiKey(active || null);
      } catch (error) {
        console.error('Error fetching API keys:', error);
      }
    };

    loadApiKey();
  }, [currentService]);

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
        services,
        refreshServices,
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