import { supabase } from '../lib/supabase';
import { Contact } from './contactService';
import { ContactPreferences } from './contactPreferenceService';

export interface Segment {
    id: string;
    name: string;
    description: string;
    filters: SegmentFilter[];
    service_id: string;
    created_at: string;
    updated_at: string;
    contactCount?: number; // Calculated on client side for now
}

export interface SegmentFilter {
    field: 'tags' | 'address' | 'email' | 'phone' | 'name' | 'email_preference' | 'sms_preference' | 'letter_preference';
    operator: 'contains' | 'equals' | 'starts_with' | 'ends_with' | 'not_contains';
    value: string;
    logic?: 'AND' | 'OR';
}

export const segmentService = {
    async getSegments(serviceId: string): Promise<Segment[]> {
        const { data, error } = await supabase
            .from('segments')
            .select('*')
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((item: any) => ({
            ...item,
            filters: item.filter_query // Map DB column to frontend property
        })) as Segment[];
    },

    async createSegment(segment: Omit<Segment, 'id' | 'created_at' | 'updated_at'>): Promise<Segment> {
        const dbSegment = {
            name: segment.name,
            description: segment.description,
            service_id: segment.service_id,
            filter_query: segment.filters, // Map frontend property to DB column
            cached_count: segment.contactCount || 0
        };

        const { data, error } = await supabase
            .from('segments')
            .insert([dbSegment])
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            filters: data.filter_query
        } as Segment;
    },

    async updateSegment(id: string, segment: Partial<Segment>): Promise<Segment> {
        const updates: any = {
            updated_at: new Date().toISOString()
        };

        if (segment.name) updates.name = segment.name;
        if (segment.description) updates.description = segment.description;
        if (segment.filters) updates.filter_query = segment.filters;
        if (segment.contactCount !== undefined) updates.cached_count = segment.contactCount;

        const { data, error } = await supabase
            .from('segments')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return {
            ...data,
            filters: data.filter_query
        } as Segment;
    },

    async deleteSegment(id: string): Promise<void> {
        const { error } = await supabase
            .from('segments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    getMatchingContacts(filters: SegmentFilter[], contactsList: Contact[], preferences: Record<string, ContactPreferences> = {}): Contact[] {
        return contactsList.filter(contact => {
            if (filters.length === 0) return true;

            let result = this.checkFilterMatch(contact, filters[0], preferences[contact.id]);

            for (let i = 1; i < filters.length; i++) {
                const filter = filters[i];
                const logic = filters[i - 1].logic || 'AND';
                const isMatch = this.checkFilterMatch(contact, filter, preferences[contact.id]);

                if (logic === 'OR') {
                    result = result || isMatch;
                } else {
                    result = result && isMatch;
                }
            }

            return result;
        });
    },

    checkFilterMatch(contact: Contact, filter: SegmentFilter, preferences?: ContactPreferences): boolean {
        // Handle preference filters
        if (['email_preference', 'sms_preference', 'letter_preference'].includes(filter.field)) {
            if (!preferences) return false;

            const prefValue = filter.field === 'email_preference' ? preferences.email :
                filter.field === 'sms_preference' ? preferences.sms :
                    preferences.letter;

            const targetValue = filter.value === 'true';
            return prefValue === targetValue;
        }

        let fieldValue = '';

        switch (filter.field) {
            case 'tags':
                fieldValue = (contact.tags || []).join(' ').toLowerCase();
                break;
            case 'address':
                fieldValue = `${contact.address_line_1 || ''} ${contact.postcode || ''}`.toLowerCase();
                break;
            case 'email':
                fieldValue = (contact.email || '').toLowerCase();
                break;
            case 'phone':
                fieldValue = (contact.phone || '').toLowerCase();
                break;
            case 'name':
                fieldValue = `${contact.first_name || ''} ${contact.last_name || ''}`.toLowerCase();
                break;
        }

        const searchValue = filter.value.toLowerCase();

        switch (filter.operator) {
            case 'contains':
                return fieldValue.includes(searchValue);
            case 'equals':
                return fieldValue === searchValue;
            case 'starts_with':
                return fieldValue.startsWith(searchValue);
            case 'ends_with':
                return fieldValue.endsWith(searchValue);
            case 'not_contains':
                return !fieldValue.includes(searchValue);
            default:
                return false;
        }
    }
};
