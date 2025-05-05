import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { CONFIG } from './config';

const client = new DynamoDBClient({
  region: CONFIG.REGION,
  ...(CONFIG.DYNAMO_ENDPOINT ? { endpoint: CONFIG.DYNAMO_ENDPOINT } : {}),
});

const docClient = DynamoDBDocumentClient.from(client);

interface SearchRecord {
  id: string;
  crypto: string;
  email: string;
  price: number;
  timestamp: string;
}

interface PriceCacheRecord {
  id: string;
  price: number;
  updated: string;
}

export const saveSearchRecord = async (record: SearchRecord) => {
  const command = new PutCommand({
    TableName: CONFIG.TABLE_NAMES.SEARCH_HISTORY,
    Item: record,
  });

  await docClient.send(command);
};

export const savePriceCache = async (record: PriceCacheRecord) => {
  const command = new PutCommand({
    TableName: CONFIG.TABLE_NAMES.PRICE_CACHE,
    Item: record,
  });

  await docClient.send(command);
};

export const getPriceCache = async (crypto: string): Promise<number> => {
  const cached = await docClient.send(
    new GetCommand({
      TableName: CONFIG.TABLE_NAMES.PRICE_CACHE,
      Key: { id: crypto },
    })
  );

  return cached.Item?.price;
};

export const getCachedCoinIds = async (): Promise<string[]> => {
  const result = await client.send(
    new ScanCommand({
      TableName: CONFIG.TABLE_NAMES.PRICE_CACHE,
      ProjectionExpression: 'id',
    })
  );
  return result.Items?.map((item) => item.id) ?? [];
};
