import { supabase } from '../lib/supabase';

export interface Message {
    id: string;
    service_id: string;
    message_type: 'email' | 'sms' | 'letter';
    status: 'draft' | 'scheduled' | 'sent' | 'delivered' | 'failed' | 'processing' | 'pending' | 'cancelled';
    subject?: string;
    content_preview: string;
    recipients_count: number;
    total_recipients: number;
    recipient_mode: 'contact' | 'segment' | 'manual';
    segment_id?: string;
    template_id?: string;
    scheduled_at?: string;
    sent_at?: string;
    created_at: string;
    updated_at: string;
    metadata?: any;
}

export const messageService = {
    async getMessages(serviceId: string) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('service_id', serviceId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Message[];
    },

    async getMessage(id: string) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Message;
    },

    async createMessage(message: Partial<Message>) {
        const { data, error } = await supabase
            .from('messages')
            .insert([message])
            .select()
            .single();

        if (error) throw error;
        return data as Message;
    },

    async updateMessage(id: string, updates: Partial<Message>) {
        const { data, error } = await supabase
            .from('messages')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Message;
    },

    async deleteMessage(id: string) {
        const { error } = await supabase
            .from('messages')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // Helper to create a draft specifically
    async createDraft(serviceId: string, message_type: 'email' | 'sms' | 'letter', data: Partial<Message>) {
        return this.createMessage({
            ...data,
            service_id: serviceId,
            message_type,
            status: 'draft',
            recipients_count: data.recipients_count || 0
        });
    },

    async addRecipients(messageId: string, recipients: { contact_id?: string, personalised_content: any }[]) {
        const { error } = await supabase
            .from('message_recipients')
            .insert(recipients.map(r => ({
                message_id: messageId,
                contact_id: r.contact_id,
                personalised_content: r.personalised_content,
                status: 'pending'
            })));

        if (error) throw error;
    },

    async sendNow(messageId: string) {
        // First update message status to pending
        await this.updateMessage(messageId, { status: 'pending' });

        // Trigger the edge function
        const { data, error } = await supabase.functions.invoke('process-message', {
            body: { messageId }
        });

        if (error) throw error;
        return data;
    },

    async getMessagesForContact(contactId: string) {
        const { data, error } = await supabase
            .from('message_recipients')
            .select(`
                id,
                status,
                delivered_at,
                personalised_content,
                messages (
                    id,
                    subject,
                    message_type,
                    content_preview,
                    sent_at,
                    scheduled_at,
                    status
                )
            `)
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((recipient: any) => ({
            id: recipient.id,
            type: recipient.messages.message_type,
            subject: recipient.personalised_content?.parsed_subject || recipient.messages.subject || (recipient.messages.message_type === 'sms' ? 'Text Message' : 'No Subject'),
            date: recipient.delivered_at || recipient.messages.sent_at || recipient.messages.scheduled_at || recipient.messages.created_at,
            status: recipient.status,
            content: recipient.personalised_content?.parsed_content || recipient.messages.content_preview
        }));
    },

    async getDashboardStats(serviceId: string) {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

        const getCount = async (type: string, start?: string, end?: string) => {
            let query = supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('service_id', serviceId)
                .eq('message_type', type)
                .eq('status', 'delivered');

            if (start) query = query.gte('sent_at', start);
            if (end) query = query.lt('sent_at', end);

            const { count, error } = await query;
            if (error) throw error;
            return count || 0;
        };

        const types = ['email', 'sms', 'letter'] as const;
        const rates = { email: 0.15, sms: 0.10, letter: 1.30 };

        const stats: any = {};

        for (const type of types) {
            const currentCount = await getCount(type, thirtyDaysAgo);
            const prevCount = await getCount(type, sixtyDaysAgo, thirtyDaysAgo);
            const lifetimeCount = await getCount(type);

            let change = '0%';
            if (prevCount > 0) {
                const diff = ((currentCount - prevCount) / prevCount) * 100;
                change = `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`;
            } else if (currentCount > 0) {
                change = '+100%';
            }

            const costSaved = (lifetimeCount * rates[type]).toLocaleString('en-GB', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });

            stats[type] = {
                value: lifetimeCount.toLocaleString(),
                change,
                costSaved
            };
        }

        return stats;
    },

    async getRecentActivity(serviceId: string, limit: number = 5) {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('service_id', serviceId)
            .neq('status', 'draft')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data as Message[];
    }
};
