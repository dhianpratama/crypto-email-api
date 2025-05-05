import { fetchAndStorePrices } from './index';

export const handler = async () => {
  await fetchAndStorePrices();
};
