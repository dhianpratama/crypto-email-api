export type CryptoRequest = {
  crypto: string;
  email: string;
};

export enum PriceSource {
  LIVE = 'live',
  CACHE = 'cache',
}

export enum SearchStatus {
  REQUESTED = 'requested',
  PRICE_FOUND = 'price_found',
  EMAIL_SENT = 'email_sent',
  EMAIL_FAILED = 'email_failed',
  PRICE_UNAVAILABLE = 'price_unavailable',
}

export type SearchRecord = {
  id: string;
  crypto: string;
  email: string;
  price?: number;
  requestedAt: string;
  updatedAt?: string;
  status: string;
  priceSource?: string;
};

export type PriceCacheRecord = {
  id: string;
  price?: number;
  updated: string;
};

export type SearchHistoryResponse = {
  results: SearchRecord[];
  lastEvaluatedKey: string | null;
};

export type UpdateSearchRecordParams = {
  id: string;
  price: number;
  priceSource: string;
  status: SearchStatus;
};
