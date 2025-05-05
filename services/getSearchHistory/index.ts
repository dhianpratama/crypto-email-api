import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  QueryCommandInput,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { CONFIG } from '@shared/config';
import { SearchHistoryResponse, SearchRecord } from '@shared/types';

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: CONFIG.REGION,
    ...(CONFIG.DYNAMO_ENDPOINT ? { endpoint: CONFIG.DYNAMO_ENDPOINT } : {}),
  })
);

export const handleGetSearchHistory = async (
  event: APIGatewayProxyEvent
): Promise<SearchHistoryResponse> => {
  const queryParams = event.queryStringParameters || {};
  const emailFilter = queryParams.email;
  const limit = parseInt(queryParams.limit || '10', 10);
  const sort = (queryParams.sort || 'desc').toLowerCase();
  const startKey = queryParams.startKey
    ? JSON.parse(decodeURIComponent(queryParams.startKey))
    : undefined;

  let items: SearchRecord[] = [];
  let lastEvaluatedKey: Record<string, unknown> | null = null;

  if (emailFilter) {
    // Use GSI for efficient email filtering
    const queryParams: QueryCommandInput = {
      TableName: CONFIG.TABLE_NAMES.SEARCH_HISTORY,
      IndexName: 'EmailIndex',
      KeyConditionExpression: '#email = :email',
      ExpressionAttributeNames: {
        '#email': 'email',
      },
      ExpressionAttributeValues: {
        ':email': emailFilter,
      },
      Limit: limit,
      ExclusiveStartKey: startKey,
    };

    const data = await docClient.send(new QueryCommand(queryParams));
    items = (data.Items || []) as SearchRecord[];
    lastEvaluatedKey = data.LastEvaluatedKey;
  } else {
    // Fall back to full scan
    const scanParams: ScanCommandInput = {
      TableName: CONFIG.TABLE_NAMES.SEARCH_HISTORY,
      Limit: limit,
      ExclusiveStartKey: startKey,
    };

    const data = await docClient.send(new ScanCommand(scanParams));
    items = (data.Items || []) as SearchRecord[];
    lastEvaluatedKey = data.LastEvaluatedKey;
  }

  // Sort by timestamp
  items.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return sort === 'asc' ? timeA - timeB : timeB - timeA;
  });

  return {
    results: items,
    lastEvaluatedKey: lastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(lastEvaluatedKey))
      : null,
  };
};
