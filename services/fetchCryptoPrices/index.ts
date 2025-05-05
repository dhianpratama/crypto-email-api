import axios from 'axios';
import { getCachedCoinIds, savePriceCache } from '@shared/dynamo';

const defaultCoins = ['bitcoin', 'ethereum', 'dogecoin', 'solana', 'binancecoin'];

export const fetchAndStorePrices = async () => {
  const now = new Date().toISOString();

  const cachedCoins = await getCachedCoinIds();
  const allCoins = Array.from(new Set([...defaultCoins, ...cachedCoins]));

  console.log(`🔄 Fetching prices for: ${allCoins.join(', ')}`);

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${allCoins.join(',')}&vs_currencies=usd`;

  const res = await axios.get(url);
  const prices = res.data;

  for (const coin of allCoins) {
    const price = prices[coin]?.usd;
    if (price === undefined) {
      console.warn(`⚠️ No price returned for ${coin}`);
      continue;
    }

    await savePriceCache({
      id: coin,
      price,
      updated: now,
    });

    console.log(`✅ ${coin} cached: $${price}`);
  }
};
