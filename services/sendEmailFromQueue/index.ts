import { SQSEvent } from 'aws-lambda';
import { sendEmail } from '@shared/email';

export const handleEmailRequest = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);

    const { crypto, price, email, timestamp } = message;

    const subject = `📈 ${crypto.toUpperCase()} Price Alert`;
    const body = `
Hello,

Here's your requested update:

Crypto: ${crypto}
Price: $${price}
Time: ${timestamp}

This is an automated alert from your Crypto Tracker system.
`;

    await sendEmail({ to: email, subject, body });
  }
};
