import { sendEmail } from './email';
import { CONFIG } from './config';

// 🧪 Mock send method
const mockSend = jest.fn();

jest.mock('@aws-sdk/client-ses', () => {
  return {
    SESClient: jest.fn(() => ({ send: mockSend })),
    SendEmailCommand: jest.fn(),
  };
});

// 🧼 Reset CONFIG between tests
jest.mock('./config', () => {
  return {
    CONFIG: {
      IS_LOCAL: false,
      REGION: 'ap-southeast-2',
      SES_SENDER: 'noreply@example.com',
    },
  };
});

describe('sendEmail()', () => {
  const basePayload = {
    to: 'user@example.com',
    subject: 'Test Subject',
    body: 'Hello world',
  };

  beforeEach(() => {
    mockSend.mockReset();
  });

  test('sends mock email when IS_LOCAL is true', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    (CONFIG.IS_LOCAL as boolean) = true;

    await sendEmail(basePayload);

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[MOCK]'));
    expect(mockSend).not.toHaveBeenCalled();

    logSpy.mockRestore();
  });

  test('throws error if SES_SENDER is not set', async () => {
    (CONFIG.IS_LOCAL as boolean) = false;
    (CONFIG.SES_SENDER as string) = '';

    await expect(sendEmail(basePayload)).rejects.toThrow(
      'SES_SENDER is not set in environment variables'
    );
  });

  test('sends email via SES when in prod', async () => {
    (CONFIG.IS_LOCAL as boolean) = false;
    (CONFIG.SES_SENDER as string) = 'noreply@example.com';
    mockSend.mockResolvedValueOnce({ MessageId: 'abc-123' });

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await sendEmail(basePayload);

    expect(mockSend).toHaveBeenCalled();

    expect(logSpy.mock.calls[0][0]).toContain('Email sent via SES');

    logSpy.mockRestore();
  });
});
