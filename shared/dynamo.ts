import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { CONFIG } from './config';

console.log('>>> CONFIG: >>> ', CONFIG)

const client = new DynamoDBClient({
  region: CONFIG.REGION,
  endpoint: CONFIG.DYNAMO_ENDPOINT,
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

export const TABLE_NAMES = {
  SEARCH_HISTORY: 'CryptoSearchHistory',
  PRICE_CACHE: 'CryptoPriceCache',
};


export const saveSearchRecord = async (record: SearchRecord) => {
  const command = new PutCommand({
    TableName: TABLE_NAMES.SEARCH_HISTORY,
    Item: record,
  });

  await docClient.send(command);
};

export const savePriceCache = async (record: PriceCacheRecord) => {
  const command = new PutCommand({
    TableName: TABLE_NAMES.PRICE_CACHE,
    Item: record,
  });

  await docClient.send(command);
};

export const getPriceCache = async (crypto: string): Promise<number> => {
  const cached = await docClient.send(new GetCommand({
        TableName: TABLE_NAMES.PRICE_CACHE,
        Key: { id: crypto },
  }));

  return cached.Item?.price;
}
