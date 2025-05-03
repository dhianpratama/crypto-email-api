export const CONFIG = {
    TABLE_NAME: process.env.TABLE_NAME || 'CryptoSearchHistory',
    QUEUE_URL: process.env.QUEUE_URL || '',
    REGION: process.env.AWS_REGION || 'us-east-1', // optional, for SDK clients
    SES_SENDER: process.env.SES_SENDER || '',      // for email microservice
    DYNAMO_ENDPOINT: process.env.DYNAMO_ENDPOINT
};
  


aws dynamodb create-table \
  --table-name CryptoSearchHistory \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAYPERREQUEST \
  --endpoint-url http://localhost:8001 \
  --region ap-southeast-2
