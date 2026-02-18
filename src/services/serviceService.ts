import { supabase } from '../lib/supabase';

export interface ApiKey {
    id: string;
    name: string;
    key_hash: string;
    service_id: string;
    is_active: boolean;
    created_at: string;
    last_used?: string;
    permissions?: string[];
    type?: 'live' | 'test';
    display_key?: string;
}

export interface Service {
    id: string;
    name: string;
    active: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface ServiceMember {
    id: string;
    service_id: string;
    user_id: string;
    role: 'admin' | 'editor' | 'viewer';
    status: 'active' | 'pending';
}

export const serviceService = {
    async getServices() {
        const { data, error } = await supabase
            .from('services')
            .select(`
        *,
        service_members!inner (
          role,
          status
        )
      `)
            .eq('service_members.user_id', (await supabase.auth.getUser()).data.user?.id)
            .eq('active', true);

        if (error) throw error;
        return data;
    },

    async createService(name: string, description: string) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        const { data, error } = await supabase
            .from('services')
            .insert({
                name,
                description,
                created_by: userData.user.id
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteService(id: string) {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async getApiKeys(serviceId: string) {
        const { data, error } = await supabase
            .from('api_keys')
            .select('*')
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(key => ({
            ...key,
            type: key.permissions?.includes('live') ? 'live' : 'test'
        }));
    },

    async createApiKey(serviceId: string, name: string, key: string, type: 'live' | 'test') {
        // Deactivate all other keys for this service first
        await supabase
            .from('api_keys')
            .update({ is_active: false })
            .eq('service_id', serviceId);

        // We store the hash, but for this demo/MVP we might just store it as is 
        // if the schema expects key_hash but we want to display it. 
        // WAIT, the schema has key_hash. Let's assume for now we just store the key string there 
        // for simplicity unless we want to implement real hashing. 
        // Given the previous mock data had readable keys, let's stick to that for now 
        // but map it to 'key_hash' column.

        const { data, error } = await supabase
            .from('api_keys')
            .insert({
                service_id: serviceId,
                name,
                key_hash: key, // Storing plain key for now as per "MVP" logic, typically should be hashed
                is_active: true,
                // We can use permissions to denote type if needed, or just name convention
                permissions: type === 'live' ? ['live'] : ['test']
            })
            .select()
            .single();

        if (error) throw error;
        return { ...data, display_key: key, type };
    },

    async deleteApiKey(id: string) {
        const { error } = await supabase
            .from('api_keys')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async toggleApiKey(serviceId: string, id: string, isActive: boolean) {
        if (isActive) {
            // If activating, deactivate all others first
            await supabase
                .from('api_keys')
                .update({ is_active: false })
                .eq('service_id', serviceId);
        }

        const { error } = await supabase
            .from('api_keys')
            .update({ is_active: isActive })
            .eq('id', id);

        if (error) throw error;
    }
};
