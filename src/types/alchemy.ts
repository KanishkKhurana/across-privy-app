export interface TokenMetadata {
  decimals: number;
  logo?: string;
  name: string;
  symbol: string;
}

export interface TokenPrice {
  currency: string;
  value: string;
  lastUpdatedAt: string;
}

export interface Token {
  address: string;
  network: string;
  tokenAddress: string;
  tokenBalance: string;
  tokenMetadata?: TokenMetadata;
  tokenPrices?: TokenPrice[];
  error?: string | null;
}

export interface TokensResponse {
  data: {
    tokens: Token[];
    pageKey?: string;
  };
}

export interface TokensByAddressRequest {
  addresses: {
    address: string;
    networks: string[];
  }[];
  withMetadata?: boolean;
  withPrices?: boolean;
  includeNativeTokens?: boolean;
  includeErc20Tokens?: boolean;
  pageKey?: string;
}
