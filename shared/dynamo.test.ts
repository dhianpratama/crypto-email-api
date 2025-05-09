const mockSend = jest.fn();
const mockClient = { send: mockSend }; // for `client.send`

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => mockClient), // return mock client
}));

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const actual = jest.requireActual('@aws-sdk/lib-dynamodb');
  return {
    ...actual,
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({ send: mockSend })), // also mock docClient
    },
    GetCommand: jest.fn(),
    PutCommand: jest.fn(),
    UpdateCommand: jest.fn(),
    ScanCommand: jest.fn(),
  };
});

// ✅ Import AFTER the mocks are registered
import {
  getPriceCache,
  saveSearchRecord,
  updateSearchPrice,
  updateSearchStatus,
  savePriceCache,
  getCachedCoinIds,
} from './dynamo';

import {
  SearchRecord,
  SearchStatus,
  PriceCacheRecord,
  UpdateSearchRecordParams,
  PriceSource,
} from './types';

beforeEach(() => {
  mockSend.mockReset();
});

describe('dynamo.ts', () => {
  test('getPriceCache returns price when found', async () => {
    mockSend.mockResolvedValueOnce({ Item: { id: 'bitcoin', price: 1000 } });
    const price = await getPriceCache('bitcoin');
    expect(price).toBe(1000);
  });

  test('getPriceCache returns undefined when not found', async () => {
    mockSend.mockResolvedValueOnce({});
    const price = await getPriceCache('bitcoin');
    expect(price).toBeUndefined();
  });

  test('saveSearchRecord sends correct payload', async () => {
    const record: SearchRecord = {
      id: 'abc123',
      crypto: 'bitcoin',
      email: 'test@example.com',
      status: SearchStatus.REQUESTED,
      requestedAt: new Date().toISOString(),
    };

    await saveSearchRecord(record);
    expect(mockSend).toHaveBeenCalled();
  });

  test('updateSearchPrice sends update command with expected values', async () => {
    const update: UpdateSearchRecordParams = {
      id: 'abc123',
      price: 2000,
      priceSource: PriceSource.LIVE,
      status: SearchStatus.PRICE_FOUND,
    };

    await updateSearchPrice(update);
    expect(mockSend).toHaveBeenCalled();
  });

  test('updateSearchStatus updates status field only', async () => {
    await updateSearchStatus('abc123', SearchStatus.EMAIL_SENT);
    expect(mockSend).toHaveBeenCalled();
  });

  test('savePriceCache writes coin price to cache table', async () => {
    const record: PriceCacheRecord = {
      id: 'dogecoin',
      price: 0.25,
      updated: new Date().toISOString(),
    };

    await savePriceCache(record);
    expect(mockSend).toHaveBeenCalled();
  });

  test('getCachedCoinIds returns array of ids', async () => {
    mockSend.mockResolvedValueOnce({ Items: [{ id: 'btc' }, { id: 'eth' }] });
    const result = await getCachedCoinIds();
    expect(result).toEqual(['btc', 'eth']);
  });

  test('getCachedCoinIds returns empty array when no items', async () => {
    mockSend.mockResolvedValueOnce({});
    const result = await getCachedCoinIds();
    expect(result).toEqual([]);
  });
});
