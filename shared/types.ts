export type CryptoRequest = {
  crypto: string;
  email: string;
};

export type SearchRecord = {
  id: string;
  crypto: string;
  email: string;
  price: number;
  timestamp: string;
};

export type PriceCacheRecord = {
  id: string;
  price: number;
  updated: string;
};

export type SearchHistoryResponse = {
  results: SearchRecord[];
  lastEvaluatedKey: string | null;
};
