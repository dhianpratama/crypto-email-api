import { SQSEvent } from 'aws-lambda';
import { sendEmail } from '@shared/email';
import { tryFetchPriceFromCG } from '@shared/coingecko';
import {
  getPriceCache,
  savePriceCache,
  updateSearchPrice,
  updateSearchStatus,
} from '@shared/dynamo';
import { PriceSource, SearchStatus } from '@shared/types';

export const handleEmailRequest = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);

    const { id, crypto, email, timestamp } = message;

    let price;

    // Try to get price from cache
    let priceSource;
    try {
      price = await getPriceCache(crypto);
      priceSource = PriceSource.CACHE;
    } catch (err) {
      console.warn('⚠️ Cache lookup failed:', err);
    }

    if (price === undefined) {
      try {
        price = await tryFetchPriceFromCG(crypto);

        if (price === undefined) {
          await updateSearchStatus(id, SearchStatus.PRICE_UNAVAILABLE);
          throw new Error(`Price for "${crypto}" not found.`);
        }

        // Save to cache for next time
        await savePriceCache({
          id: crypto,
          price,
          updated: timestamp,
        });

        // Update price on search history

        priceSource = PriceSource.LIVE;
        await updateSearchPrice({
          id,
          price,
          priceSource,
          status: SearchStatus.PRICE_FOUND,
        });
      } catch {
        throw new Error('Unable to fetch price from external service.');
      }
    }

    const subject = `${crypto.toUpperCase()} Price Alert`;
    const body = `
Hello,

Here's your requested update:

Crypto: ${crypto}
Price: $${price}
Time: ${timestamp}

This is an automated alert from your Crypto Tracker system.
`;

    try {
      await sendEmail({ to: email, subject, body });
      await updateSearchStatus(id, SearchStatus.EMAIL_SENT);
    } catch {
      await updateSearchStatus(id, SearchStatus.EMAIL_FAILED);
    }
  }
};
