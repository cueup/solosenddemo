const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Supabase credentials not found. Please check your .env file');
}

const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/govuk-notify`;

async function callEdgeFunction(action: string, params: any): Promise<any> {
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ action, ...params }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Request failed');
  }

  return data.data;
}

export const notifyClient = {
  sendEmail: async (templateId: string, emailAddress: string, options?: any) => {
    return { data: await callEdgeFunction('sendEmail', { templateId, emailAddress, options }) };
  },
  sendSms: async (templateId: string, phoneNumber: string, options?: any) => {
    return { data: await callEdgeFunction('sendSms', { templateId, phoneNumber, options }) };
  },
  sendLetter: async (templateId: string, options: any) => {
    return { data: await callEdgeFunction('sendLetter', { templateId, options }) };
  },
  getNotificationById: async (notificationId: string) => {
    return { data: await callEdgeFunction('getNotificationById', { notificationId }) };
  },
  getNotifications: async (templateType?: string, status?: string, reference?: string, olderThan?: string) => {
    return { data: await callEdgeFunction('getNotifications', { templateType, status, reference, olderThan }) };
  },
};

export type NotificationResponse = {
  id: string;
  reference?: string;
  content: {
    body: string;
    from_number?: string;
    subject?: string;
    from_email?: string;
  };
  uri: string;
  template: {
    id: string;
    version: number;
    uri: string;
  };
};

export type SendSmsOptions = {
  personalisation?: Record<string, string | string[]>;
  reference?: string;
  smsSenderId?: string;
};

export type SendEmailOptions = {
  personalisation?: Record<string, string | string[]>;
  reference?: string;
  emailReplyToId?: string;
  oneClickUnsubscribeURL?: string;
};

export type SendLetterOptions = {
  personalisation: Record<string, string | string[]>;
  reference?: string;
};
