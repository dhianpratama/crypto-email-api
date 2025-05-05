export const CONFIG = {
  QUEUE_URL: process.env.QUEUE_URL,
  REGION: process.env.AWS_REGION || 'ap-southeast-2',
  SES_SENDER: process.env.SES_SENDER || '', // for email microservice
  DYNAMO_ENDPOINT: process.env.DYNAMO_ENDPOINT?.trim() || undefined,
  IS_LOCAL: process.env.IS_LOCAL ? process.env.IS_LOCAL === 'true' : false,
  TABLE_NAMES: {
    SEARCH_HISTORY: process.env.SEARCH_HISTORY_TABLE || 'CryptoSearchHistory',
    PRICE_CACHE: process.env.PRICE_CACHE_TABLE || 'CryptoPriceCache',
  }
};
