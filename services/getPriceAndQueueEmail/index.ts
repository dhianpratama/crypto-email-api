import { APIGatewayProxyEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { getPriceCache, saveSearchRecord } from '@shared/dynamo';
import { sendToQueue } from '@shared/sqs';
import { ValidationError } from '@shared/errors';

interface RequestBody {
  crypto: string;
  email: string;
}

export const handleCryptoRequest = async (event: APIGatewayProxyEvent): Promise<void> => {
  if (!event.body) throw new ValidationError('Missing request body');

  const { crypto, email }: RequestBody = JSON.parse(event.body);

  if (!crypto || !email) throw new ValidationError('Missing "crypto" or "email"');

  const timestamp = new Date().toISOString();
  let price: number | undefined;

  // Try to get price from cache
  try {
    price = await getPriceCache(crypto);
  } catch (err) {
    console.warn('⚠️ Cache lookup failed:', err);
  }

  const id = uuidv4();
  await saveSearchRecord({
    id,
    crypto,
    email,
    price,
    timestamp,
  });

  // Step 4: Queue email
  await sendToQueue({
    id,
    crypto,
    email,
    price,
    timestamp,
  });
};
