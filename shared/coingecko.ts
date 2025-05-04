import axios from 'axios';

export const tryFetchPriceFromCG = async (crypto: string, retries = 1): Promise<number | undefined> => {
    try {
        const res = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${crypto}&vs_currencies=usd`
        );
        return res.data?.[crypto]?.usd;
    } catch (err) {
      if (retries > 0) {
        return await tryFetchPriceFromCG(crypto, retries - 1);
      }
      throw err;
    }
  };
  