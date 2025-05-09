const mockSend = jest.fn();
const sendCommandMock = jest.fn(); // 👈 to capture constructor input

jest.mock('@aws-sdk/client-sqs', () => {
  return {
    SQSClient: jest.fn(() => ({ send: mockSend })),
    SendMessageCommand: jest.fn((input) => {
      sendCommandMock(input); // capture args
      return { input }; // mock shape
    }),
  };
});

jest.mock('./config', () => ({
  CONFIG: {
    IS_LOCAL: false,
    QUEUE_URL: 'https://mock-queue-url',
  },
}));

import { sendToQueue } from './sqs';
import { CONFIG } from './config';

describe('sendToQueue()', () => {
  const mockMessage = {
    id: 'abc123',
    crypto: 'bitcoin',
    email: 'test@example.com',
    timestamp: new Date().toISOString(),
    price: 50000,
  };

  beforeEach(() => {
    mockSend.mockReset();
  });

  test('logs message in local mode without calling SQS', async () => {
    (CONFIG.IS_LOCAL as boolean) = true;
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await sendToQueue(mockMessage);

    expect(logSpy).toHaveBeenCalledWith('[MOCK] Queued message to SQS:', mockMessage);
    expect(mockSend).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });

  test('throws if QUEUE_URL is missing', async () => {
    (CONFIG.IS_LOCAL as boolean) = false;
    (CONFIG.QUEUE_URL as string) = '';

    await expect(sendToQueue(mockMessage)).rejects.toThrow('SQS QUEUE_URL is not defined');
  });

  test('sends message to SQS if not in local mode', async () => {
    (CONFIG.IS_LOCAL as boolean) = false;
    (CONFIG.QUEUE_URL as string) = 'https://mock-queue-url';

    await sendToQueue(mockMessage);

    expect(mockSend).toHaveBeenCalled();
    expect(sendCommandMock).toHaveBeenCalledWith({
      QueueUrl: 'https://mock-queue-url',
      MessageBody: JSON.stringify(mockMessage),
    });
  });
});
