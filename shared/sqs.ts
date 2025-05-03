import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = new SQSClient({});
const QUEUE_URL = process.env.QUEUE_URL || '';

interface QueueMessage {
  id: string;
  crypto: string;
  email: string;
  price: number;
  timestamp: string;
}

export const sendToQueue = async (msg: QueueMessage) => {
  if (!QUEUE_URL) {
    throw new Error('SQS QUEUE_URL is not defined');
  }

  const command = new SendMessageCommand({
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(msg),
  });

  await sqsClient.send(command);
};
