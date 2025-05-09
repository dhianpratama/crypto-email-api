import axios from 'axios';
import { tryFetchPriceFromCG } from './coingecko';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('tryFetchPriceFromCG()', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the price when API responds successfully', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        bitcoin: {
          usd: 42000,
        },
      },
    });

    const price = await tryFetchPriceFromCG('bitcoin');
    expect(price).toBe(42000);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });

  it('retries once if API call fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce({
      data: {
        ethereum: {
          usd: 3300,
        },
      },
    });

    const price = await tryFetchPriceFromCG('ethereum', 1);
    expect(price).toBe(3300);
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('throws error if all retries fail', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Service down'));

    await expect(tryFetchPriceFromCG('dogecoin', 1)).rejects.toThrow('Service down');
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  it('returns undefined if crypto is missing in API response', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {},
    });

    const price = await tryFetchPriceFromCG('nonexistentcoin');
    expect(price).toBeUndefined();
  });
});
