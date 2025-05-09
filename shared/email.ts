import { CONFIG } from './config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

interface EmailPayload {
  to: string;
  subject: string;
  body: string;
}

export const sendEmail = async ({ to, subject, body }: EmailPayload) => {
  if (CONFIG.IS_LOCAL) {
    console.log('[MOCK] Sending email:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);
    return;
  }

  if (!CONFIG.SES_SENDER) {
    throw new Error('SES_SENDER is not set in environment variables');
  }

  const ses = new SESClient({ region: CONFIG.REGION });

  const command = new SendEmailCommand({
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: { Text: { Data: body, Charset: 'UTF-8' } },
    },
    Source: CONFIG.SES_SENDER,
  });

  const result = await ses.send(command);
  console.log('Email sent via SES. Message ID:', result.MessageId);
};
