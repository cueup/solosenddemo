# GOV.UK Notify Integration Guide

This guide explains how to set up and use the GOV.UK Notify client in this application.

## What is GOV.UK Notify?

GOV.UK Notify is a government service that lets you send emails, text messages, and letters to your users. It's free to use for UK public sector organizations.

## Architecture

This integration uses a Supabase Edge Function as a backend proxy to securely call the GOV.UK Notify API. This approach:

- Keeps your API key secure on the server-side

- Works in the browser without Node.js dependencies

- Provides better error handling and security

- Follows best practices for API integrations

```

Browser → Supabase Edge Function → GOV.UK Notify API

```

## Setup Instructions

### 1. Get Your API Key

1. Go to [GOV.UK Notify](https://www.notifications.service.gov.uk/)

2. Sign in or create an account

3. Navigate to API integration → API keys

4. Click Create an API key

5. Choose the appropriate key type:

   - Test: For testing (messages not delivered, unlimited use)

   - Team and guest list: For trial mode (only team members)

   - Live: For production (requires live service)

### 2. Configure the Edge Function

The Edge Function has already been deployed. secret key: GOVUK_NOTIFY_API_KEY


### 3. Create Templates

Before sending messages, you need to create templates in GOV.UK Notify:

1. Sign in to GOV.UK Notify

2. Go to Templates

3. Click Create a new template

4. Choose the message type (Email, SMS, or Letter)

5. Create your template with placeholders like ((first_name))

6. Copy the Template ID (you'll need this for sending messages)

## Usage

### Service Layer

The NotifyService class in src/services/notifyService.ts provides a clean API for sending messages:

```typescript

import { notifyService } from './services/notifyService';

// Send an SMS

await notifyService.sendSms(

  'template-id',

  '+447700900123',

  {

    personalisation: {

      first_name: 'Amala',

      code: '123456'

    },

    reference: 'your-reference'

  }

);

// Send an Email

await notifyService.sendEmail(

  'template-id',

  'user@example.com',

  {

    personalisation: {

      first_name: 'Amala',

      appointment_date: '1 January 2018 at 1:00pm'

    },

    reference: 'your-reference'

  }

);

// Send a Letter

await notifyService.sendLetter(

  'template-id',

  {

    personalisation: {

      address_line_1: 'Amala Bird',

      address_line_2: '123 High Street',

      address_line_3: 'Richmond upon Thames',

      address_line_4: 'Middlesex',

      address_line_5: 'SW14 6BF',

      first_name: 'Amala'

    },

    reference: 'your-reference'

  }

);

```

## Message Types

### Email

Required:

- Template ID

- Email address

Optional:

- Personalisation (placeholder values)

- Reference (unique identifier)

- Email reply-to ID

- One-click unsubscribe URL

Example:

```typescript

await notifyService.sendEmail(

  'f33517ff-2a88-4f6e-b855-c550268ce08a',

  'user@example.com',

  {

    personalisation: {

      subject_line: 'Your appointment',

      first_name: 'Amala'

    },

    reference: 'appointment-123'

  }

);

```

### SMS

Required:

- Template ID

- Phone number (UK or international format)

Optional:

- Personalisation (placeholder values)

- Reference (unique identifier)

- SMS sender ID

Example:

```typescript

await notifyService.sendSms(

  'f33517ff-2a88-4f6e-b855-c550268ce08a',

  '+447700900123',

  {

    personalisation: {

      verification_code: '123456'

    },

    reference: 'login-attempt-456'

  }

);

```

### Letter

Required:

- Template ID

- Personalisation including address fields:

  - address_line_1 (required)

  - address_line_2 (required)

  - address_line_3 (required)

  - address_line_4 (optional)

  - address_line_5 (required - postcode or country)

  - address_line_6 (optional)

  - address_line_7 (optional)

Note: Your service must be live to send letters.

Example:

```typescript

await notifyService.sendLetter(

  'f33517ff-2a88-4f6e-b855-c550268ce08a',

  {

    personalisation: {

      address_line_1: 'Amala Bird',

      address_line_2: '123 High Street',

      address_line_3: 'Richmond upon Thames',

      address_line_4: 'Middlesex',

      address_line_5: 'SW14 6BF',

      first_name: 'Amala'

    },

    reference: 'annual-statement-789'

  }

);

```

## Error Handling

The service includes comprehensive error handling:

```typescript

try {

  const response = await notifyService.sendEmail(

    templateId,

    email,

    options

  );

  console.log('Message sent:', response);

} catch (error) {

  console.error('Failed to send message:', error.message);

}

```

## Testing

### Smoke Test Numbers/Addresses

Use these for smoke testing (messages not delivered):

Phone numbers:

- 07700900000

- 07700900111

- 07700900222

Email addresses:

- simulate-delivered@notifications.service.gov.uk

- simulate-delivered-2@notifications.service.gov.uk

- simulate-delivered-3@notifications.service.gov.uk

### Test Failure Responses

With a test API key:

Phone numbers:

- 07700900003 - temporary failure

- 07700900002 - permanent failure

Email addresses:

- temp-fail@simulator.notify - temporary failure

- perm-fail@simulator.notify - permanent failure

## Rate Limits

- Per minute: 3,000 messages

- Daily limits (live service):

  - 250,000 emails

  - 250,000 text messages

  - 20,000 letters

## Security Best Practices

1. Never expose your API key in the frontend - It's stored securely as a Supabase secret

2. Use environment-specific keys - Test keys for development, live keys for production

3. Rotate keys regularly - Change your API keys periodically

4. Monitor usage - Keep track of your API calls through GOV.UK Notify dashboard

5. Validate inputs - Always validate recipient data before sending

## Edge Function Details

The Edge Function (`supabase/functions/govuk-notify`) handles:

- Secure API key storage

- Request validation

- Error handling and formatting

- CORS headers for browser access

- Rate limiting (handled by GOV.UK Notify)

The function accepts POST requests with the following structure:

```json

{

  "action": "sendEmail|sendSms|sendLetter|getNotificationById|getNotifications",

  "templateId": "uuid",

  "emailAddress": "email@example.com",

  "phoneNumber": "+447700900123",

  "options": {

    "personalisation": {},

    "reference": "string"

  }

}

```

## Best Practices

1. Use references: Include a unique reference with each message for tracking

2. Handle errors: Always wrap API calls in try-catch blocks

3. Validate inputs: Check recipient details before sending

4. Test first: Use test API keys and smoke test addresses

5. Monitor usage: Keep track of your daily limits

6. Store template IDs: Keep template IDs in configuration, not hardcoded

## Troubleshooting

### Error: "GOV.UK Notify API key not configured"

- Make sure you've set the GOVUK_NOTIFY_API_KEY secret in Supabase

- Verify the Edge Function has been deployed

### Error: "No result found"

- Check that your template ID is correct

- Ensure you're using a template from the correct GOV.UK Notify service

### Messages not being delivered

- Verify you're using the correct API key type (test keys don't deliver messages)

- Check you haven't exceeded daily limits

- Ensure recipients are on your team/guest list if using team key

## Additional Resources

- [GOV.UK Notify Documentation](https://docs.notifications.service.gov.uk/)

- [Node.js Client Documentation](https://docs.notifications.service.gov.uk/node.html)

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

- [GOV.UK Notify Support](https://www.notifications.service.gov.uk/support)

## Project Structure

```

src/

├── lib/

│   ├── notifyClient.ts          # Edge Function client

│   └── notifyHelpers.ts         # Helper utilities

├── services/

│   └── notifyService.ts         # Service layer for sending messages

supabase/

└── functions/

    └── govuk-notify/

        └── index.ts             # Edge Function handler

```