export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('44')) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('0')) {
    return `+44${cleaned.substring(1)}`;
  }

  if (cleaned.length === 10) {
    return `+44${cleaned}`;
  }

  return phone;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateUKPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('44')) {
    return cleaned.length === 12;
  }

  if (cleaned.startsWith('0')) {
    return cleaned.length === 11;
  }

  return cleaned.length === 10 || cleaned.length === 11;
};

export const validateTemplateId = (templateId: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(templateId);
};

export const isSmokeTestEmail = (email: string): boolean => {
  const smokeTestEmails = [
    'simulate-delivered@notifications.service.gov.uk',
    'simulate-delivered-2@notifications.service.gov.uk',
    'simulate-delivered-3@notifications.service.gov.uk',
    'temp-fail@simulator.notify',
    'perm-fail@simulator.notify'
  ];
  return smokeTestEmails.includes(email.toLowerCase());
};

export const isSmokeTestPhone = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, '');
  const smokeTestNumbers = ['07700900000', '07700900111', '07700900222'];

  return smokeTestNumbers.some(testNum =>
    cleaned.endsWith(testNum.replace(/^0/, ''))
  );
};

export const parsePersonalisation = (json: string): Record<string, string | string[]> => {
  try {
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Personalisation must be a JSON object');
    }
    return parsed;
  } catch (error) {
    throw new Error('Invalid JSON format in personalisation');
  }
};

export const formatLetterAddress = (address: {
  line1: string;
  line2: string;
  line3: string;
  line4?: string;
  line5: string;
  line6?: string;
  line7?: string;
}): Record<string, string> => {
  const formatted: Record<string, string> = {
    address_line_1: address.line1,
    address_line_2: address.line2,
    address_line_3: address.line3,
    address_line_5: address.line5,
  };

  if (address.line4) formatted.address_line_4 = address.line4;
  if (address.line6) formatted.address_line_6 = address.line6;
  if (address.line7) formatted.address_line_7 = address.line7;

  return formatted;
};

export const getMessageTypeIcon = (type: 'email' | 'sms' | 'letter'): string => {
  const icons = {
    email: '📧',
    sms: '💬',
    letter: '📮'
  };
  return icons[type];
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    'delivered': 'green',
    'sending': 'blue',
    'pending': 'yellow',
    'failed': 'red',
    'permanent-failure': 'red',
    'temporary-failure': 'orange',
    'technical-failure': 'red'
  };
  return colors[status] || 'gray';
};

export const sanitizeReference = (reference: string): string => {
  return reference.replace(/[^a-zA-Z0-9-_]/g, '').substring(0, 50);
};
