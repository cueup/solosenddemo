import {
  notifyClient,
  NotificationResponse,
  SendSmsOptions,
  SendEmailOptions,
  SendLetterOptions
} from '../lib/notifyClient';

export class NotifyService {
  async sendSms(
    templateId: string,
    phoneNumber: string,
    options?: SendSmsOptions,
    apiKey?: string
  ): Promise<NotificationResponse> {
    try {
      const response = await notifyClient.sendSms(templateId, phoneNumber, options, apiKey);
      return response.data;
    } catch (error: any) {
      console.error('Error sending SMS:', error);
      throw this.handleError(error);
    }
  }

  async sendEmail(
    templateId: string,
    emailAddress: string,
    options?: SendEmailOptions,
    apiKey?: string
  ): Promise<NotificationResponse> {
    try {
      const response = await notifyClient.sendEmail(templateId, emailAddress, options, apiKey);
      return response.data;
    } catch (error: any) {
      console.error('Error sending email:', error);
      throw this.handleError(error);
    }
  }

  async sendLetter(
    templateId: string,
    options: SendLetterOptions,
    apiKey?: string
  ): Promise<NotificationResponse> {
    try {
      const response = await notifyClient.sendLetter(templateId, options, apiKey);
      return response.data;
    } catch (error: any) {
      console.error('Error sending letter:', error);
      throw this.handleError(error);
    }
  }

  async getNotificationById(notificationId: string): Promise<any> {
    try {
      const response = await notifyClient.getNotificationById(notificationId);
      return response.data;
    } catch (error: any) {
      console.error('Error getting notification:', error);
      throw this.handleError(error);
    }
  }

  async getNotifications(
    templateType?: 'email' | 'sms' | 'letter',
    status?: string,
    reference?: string,
    olderThan?: string
  ): Promise<any> {
    try {
      const response = await notifyClient.getNotifications(
        templateType,
        status,
        reference,
        olderThan
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting notifications:', error);
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (error.response?.data) {
      const errorData = error.response.data;
      const errorMessage = errorData.errors?.[0]?.message || 'Unknown error occurred';
      const errorType = errorData.errors?.[0]?.error || 'Error';
      return new Error(`${errorType}: ${errorMessage}`);
    }
    return new Error(error.message || 'An unexpected error occurred');
  }
}

export const notifyService = new NotifyService();
