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
    }
};
