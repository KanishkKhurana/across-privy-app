export const CHAIN_ID_MAP: Record<string, number> = {
  "eth-mainnet": 1,
  "opt-mainnet": 10,
  "base-mainnet": 8453,
  "arb-mainnet": 42161,
  "unichain-mainnet": 130, // Unichain sepolia testnet - mainnet may not be supported yet
} as const;

export const getChainIdFromNetwork = (network: string): number => {
  return CHAIN_ID_MAP[network] || 1;
};

export const getNetworkFromChainId = (chainId: number): string | undefined => {
  return Object.entries(CHAIN_ID_MAP).find(([, id]) => id === chainId)?.[0];
};
