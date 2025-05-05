import { SQSEvent } from 'aws-lambda';
import { sendEmail } from '@shared/email';
import { tryFetchPriceFromCG } from '@shared/coingecko';
import { savePriceCache, updateSearchPrice } from '@shared/dynamo';

export const handleEmailRequest = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    const message = JSON.parse(record.body);

    const { id, crypto, price, email, timestamp } = message;

    // Step 2: Fallback to live CoinGecko if needed
    let latestPrice;
    if (price === undefined) {
      try {
        latestPrice = await tryFetchPriceFromCG(crypto);

        if (price === undefined) {
          throw new Error(`Price for "${crypto}" not found.`);
        }

        // Save to cache for next time
        await savePriceCache({
          id: crypto,
          price: latestPrice,
          updated: timestamp,
        });

        // Update price on search history
        await updateSearchPrice(id, latestPrice);
      } catch {
        throw new Error('Unable to fetch price from external service.');
      }
    }

    const subject = `📈 ${crypto.toUpperCase()} Price Alert`;
    const body = `
Hello,

Here's your requested update:

Crypto: ${crypto}
Price: $${price}
Time: ${timestamp}

This is an automated alert from your Crypto Tracker system.
`;

    await sendEmail({ to: email, subject, body });
  }
};
