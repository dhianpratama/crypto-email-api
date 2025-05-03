import { APIGatewayProxyEvent } from 'aws-lambda';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { saveToDynamo } from '@shared/dynamo'
import { sendToQueue } from '@shared/sqs';

interface RequestBody {
  crypto: string;
  email: string;
}

export const handleCryptoRequest = async (event: APIGatewayProxyEvent) => {
  if (!event.body) throw new Error('Missing request body');

  const { crypto, email }: RequestBody = JSON.parse(event.body);

  if (!crypto || !email) {
    throw new Error('Missing "crypto" or "email" field');
  }

  // Fetch current price from CoinGecko
  const response = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${crypto}&vs_currencies=usd`
  );

  const price = response.data?.[crypto]?.usd;
  if (price === undefined) throw new Error(`Crypto "${crypto}" not found`);

  const id = uuidv4();
  const timestamp = new Date().toISOString();

  console.log('>>> PRICE: ', price)

  // Save to DynamoDB
  await saveToDynamo({
    id,
    crypto,
    email,
    price,
    timestamp,
  });

  // // Send to SQS for email
  // await sendToQueue({
  //   id,
  //   crypto,
  //   email,
  //   price,
  //   timestamp,
  // });

  return { id, crypto, price, email, timestamp };
};
