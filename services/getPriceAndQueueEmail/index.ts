import { APIGatewayProxyEvent } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { getPriceCache, savePriceCache, saveSearchRecord } from '@shared/dynamo';
import { sendToQueue } from '@shared/sqs';
import { tryFetchPriceFromCG } from '@shared/coingecko';

interface RequestBody {
  crypto: string;
  email: string;
}

export const handleCryptoRequest = async (event: APIGatewayProxyEvent) => {
  if (!event.body) throw new Error('Missing request body');

  const { crypto, email }: RequestBody = JSON.parse(event.body);

  if (!crypto || !email) throw new Error('Missing "crypto" or "email"');

  const timestamp = new Date().toISOString();
  let price: number | undefined;

  // Step 1: Try to get price from cache
  try {
    price = await getPriceCache(crypto)
  } catch (err) {
    console.warn('⚠️ Cache lookup failed:', err);
  }

  // Step 2: Fallback to live CoinGecko if needed
  if (price === undefined) {
    try {
      price = await tryFetchPriceFromCG(crypto)

      if (price === undefined) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: `Price for "${crypto}" not found.` }),
        };
      }

      // Save to cache for next time
      await savePriceCache({
        id: crypto,
        price,
        updated: timestamp,
      })
    } catch (err) {
      console.error('❌ Failed to fetch from CoinGecko:', err);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: 'Unable to fetch price from CoinGecko.' }),
      };
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

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Queued for email', crypto, price, email }),
  };
};
