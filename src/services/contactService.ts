import { supabase } from '../lib/supabase';

export interface Contact {
    id: string;
    service_id: string;
    title: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_line_1: string;
    address_line_2?: string;
    address_line_3?: string;
    address_line_4?: string;
    address_line_5?: string;
    address_line_6?: string;
    address_line_7?: string;
    postcode: string;
    tags: string[];
    metadata?: Record<string, any>;
    created_at?: string;
    updated_at?: string;
}

export const contactService = {
    async getContacts(serviceId: string) {
        const { data, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false });

        if (error) {
            throw error;
        }

        return data as Contact[];
    },

    async createContact(contact: Omit<Contact, 'id' | 'created_at' | 'updated_at'>) {
        const { data, error } = await supabase
            .from('contacts')
            .insert([contact])
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data as Contact;
    },

    async updateContact(id: string, contact: Partial<Contact>) {
        const { data, error } = await supabase
            .from('contacts')
            .update(contact)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw error;
        }

        return data as Contact;
    },

    async deleteContact(id: string) {
        const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', id);

        if (error) {
            throw error;
        }
    }
};
