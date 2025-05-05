import { APIGatewayProxyEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { getPriceCache, savePriceCache, saveSearchRecord } from '@shared/dynamo';
import { sendToQueue } from '@shared/sqs';
import { tryFetchPriceFromCG } from '@shared/coingecko';
import { ExternalServiceError, NotFoundError, ValidationError } from '@shared/errors';

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

  // Step 1: Try to get price from cache
  try {
    price = await getPriceCache(crypto);
  } catch (err) {
    console.warn('⚠️ Cache lookup failed:', err);
  }

  // Step 2: Fallback to live CoinGecko if needed
  if (price === undefined) {
    try {
      price = await tryFetchPriceFromCG(crypto);

      if (price === undefined) {
        throw new NotFoundError(`Price for "${crypto}" not found.`);
      }

      // Save to cache for next time
      await savePriceCache({
        id: crypto,
        price,
        updated: timestamp,
      });
    } catch {
      throw new ExternalServiceError('Unable to fetch price from external service.');
    }
  }

  const id = uuidv4();

  // Step 3: Save to search history
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
