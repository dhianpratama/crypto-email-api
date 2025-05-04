import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  QueryCommand,
  ScanCommand,
  QueryCommandInput,
  ScanCommandInput,
} from '@aws-sdk/lib-dynamodb';
import { CONFIG } from '@shared/config';
import { TABLE_NAMES } from '@shared/dynamo';

const docClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: CONFIG.REGION,
    endpoint: CONFIG.DYNAMO_ENDPOINT,
  })
);

export const handleGetSearchHistory = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const queryParams = event.queryStringParameters || {};
    const emailFilter = queryParams.email;
    const limit = parseInt(queryParams.limit || '10', 10);
    const sort = (queryParams.sort || 'desc').toLowerCase();
    const startKey = queryParams.startKey ? JSON.parse(decodeURIComponent(queryParams.startKey)) : undefined;

    let items: any[] = [];
    let lastEvaluatedKey: any = null;

    if (emailFilter) {
      // Use GSI for efficient email filtering
      const queryParams: QueryCommandInput = {
        TableName: TABLE_NAMES.SEARCH_HISTORY,
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
      items = data.Items || [];
      lastEvaluatedKey = data.LastEvaluatedKey;
    } else {
      // Fall back to full scan
      const scanParams: ScanCommandInput = {
        TableName: TABLE_NAMES.SEARCH_HISTORY,
        Limit: limit,
        ExclusiveStartKey: startKey,
      };

      const data = await docClient.send(new ScanCommand(scanParams));
      items = data.Items || [];
      lastEvaluatedKey = data.LastEvaluatedKey;
    }

    // Sort by timestamp
    items.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sort === 'asc' ? timeA - timeB : timeB - timeA;
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        results: items,
        lastEvaluatedKey: lastEvaluatedKey
          ? encodeURIComponent(JSON.stringify(lastEvaluatedKey))
          : null,
      }),
    };
  } catch (err) {
    console.error('❌ Failed to fetch search history:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to retrieve search history' }),
    };
  }
};
