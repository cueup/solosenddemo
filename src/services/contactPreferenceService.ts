import { supabase } from '../lib/supabase';

export interface ContactPreferences {
    email: boolean;
    sms: boolean;
    letter: boolean;
}

export const contactPreferenceService = {
    async getPreferences(contactId: string): Promise<ContactPreferences | null> {
        const { data, error } = await supabase
            .from('contact_preferences')
            .select('preferences')
            .eq('contact_id', contactId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') { // No rows found
                return null;
            }
            throw error;
        }

        return data?.preferences as ContactPreferences;
    },

    async getPreferencesForContacts(contactIds: string[]): Promise<Record<string, ContactPreferences>> {
        if (contactIds.length === 0) return {};

        const { data, error } = await supabase
            .from('contact_preferences')
            .select('contact_id, preferences')
            .in('contact_id', contactIds);

        if (error) throw error;

        const preferencesMap: Record<string, ContactPreferences> = {};
        data?.forEach((row: any) => {
            preferencesMap[row.contact_id] = row.preferences;
        });

        return preferencesMap;
    },

    async savePreferences(contactId: string, preferences: ContactPreferences) {
        // Check if preferences exist first
        const { data: existing } = await supabase
            .from('contact_preferences')
            .select('id')
            .eq('contact_id', contactId)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('contact_preferences')
                .update({ preferences, updated_at: new Date().toISOString() })
                .eq('contact_id', contactId);

            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('contact_preferences')
                .insert([{ contact_id: contactId, preferences }]);

            if (error) throw error;
        }
    }
};
