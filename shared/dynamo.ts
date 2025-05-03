import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { CONFIG } from './config';

console.log('>>> CONFIG: >>> ', CONFIG)

const client = new DynamoDBClient({
  region: CONFIG.REGION,
  endpoint: CONFIG.DYNAMO_ENDPOINT,
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = CONFIG.TABLE_NAME

interface SearchRecord {
  id: string;
  crypto: string;
  email: string;
  price: number;
  timestamp: string;
}

export const saveToDynamo = async (record: SearchRecord) => {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: record,
  });

  await docClient.send(command);
};
