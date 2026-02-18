import { supabase } from '../lib/supabase';

export interface Template {
    id: string;
    service_id: string;
    name: string;
    description: string;
    type: 'email' | 'sms' | 'letter';
    subject?: string;
    content: string;
    variables: string[];
    notify_template_id?: string;
    created_at: string;
    updated_at: string;
}

export const templateService = {
    async getTemplates(serviceId: string) {
        const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Template[];
    },

    async createTemplate(template: Omit<Template, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('templates')
            .insert(template)
            .select()
            .single();

        if (error) throw error;
        return data as Template;
    },

    async updateTemplate(id: string, updates: Partial<Template>) {
        const { data, error } = await supabase
            .from('templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Template;
    },

    async deleteTemplate(id: string) {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
