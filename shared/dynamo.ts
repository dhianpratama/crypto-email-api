import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { CONFIG } from './config';
import { SearchRecord, PriceCacheRecord, SearchStatus, UpdateSearchRecordParams } from './types';

const client = new DynamoDBClient({
  region: CONFIG.REGION,
  ...(CONFIG.DYNAMO_ENDPOINT ? { endpoint: CONFIG.DYNAMO_ENDPOINT } : {}),
});

const docClient = DynamoDBDocumentClient.from(client);

export const saveSearchRecord = async (record: SearchRecord) => {
  const command = new PutCommand({
    TableName: CONFIG.TABLE_NAMES.SEARCH_HISTORY,
    Item: record,
  });

  await docClient.send(command);
};

export const updateSearchPrice = async (params: UpdateSearchRecordParams) => {
  const command = new UpdateCommand({
    TableName: CONFIG.TABLE_NAMES.SEARCH_HISTORY,
    Key: { id: params.id },
    UpdateExpression:
      'SET price = :price, priceSource = :priceSource, status = :status, updatedAt = :updatedAt',
    ExpressionAttributeValues: {
      ':price': params.price,
      ':priceSource': params.priceSource,
      ':status': params.status,
      ':updatedAt': new Date().toISOString(),
    },
  });

  await docClient.send(command);
};

export const updateSearchStatus = async (id: string, status: SearchStatus) => {
  const command = new UpdateCommand({
    TableName: CONFIG.TABLE_NAMES.SEARCH_HISTORY,
    Key: { id },
    UpdateExpression: 'SET status = :status',
    ExpressionAttributeValues: {
      ':status': status,
    },
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
