import {
  CreateTableCommand,
  DeleteTableCommand,
  ListTablesCommand,
  DynamoDBClient,
} from '@aws-sdk/client-dynamodb';

const endpoint = 'http://localhost:8001';
const region = 'us-east-1';

const client = new DynamoDBClient({
  region,
  endpoint,
});

const ensureTableExists = async (tableName: string, createFn: () => Promise<void>) => {
  const tables = await client.send(new ListTablesCommand({}));
  if (tables.TableNames?.includes(tableName)) {
    console.log(`🧹 Deleting existing table: ${tableName}`);
    await client.send(new DeleteTableCommand({ TableName: tableName }));
  }
  await createFn();
};

const createSearchHistoryTable = async () => {
  console.log('🛠 Creating CryptoSearchHistory table with EmailIndex...');
  await client.send(
    new CreateTableCommand({
      TableName: 'CryptoSearchHistory',
      AttributeDefinitions: [
        { AttributeName: 'id', AttributeType: 'S' },
        { AttributeName: 'email', AttributeType: 'S' },
      ],
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EmailIndex',
          KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
          Projection: { ProjectionType: 'ALL' },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
    })
  );
};

const createPriceCacheTable = async () => {
  console.log('🛠 Creating CryptoPriceCache table...');
  await client.send(
    new CreateTableCommand({
      TableName: 'CryptoPriceCache',
      AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
      KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    })
  );
};

const run = async () => {
  await ensureTableExists('CryptoSearchHistory', createSearchHistoryTable);
  await ensureTableExists('CryptoPriceCache', createPriceCacheTable);
  console.log('✅ Local DynamoDB tables are ready.');
};

run().catch((err) => {
  console.error('❌ Failed to initialize tables:', err);
  process.exit(1);
});
