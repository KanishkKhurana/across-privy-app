export const SUPPORTED_NETWORKS = {
  ETHEREUM: "eth-mainnet",
  OPTIMISM: "opt-mainnet",
  BASE: "base-mainnet",
  ARBITRUM: "arb-mainnet",
  UNICHAIN: "unichain-mainnet",
} as const;

export const NETWORK_DISPLAY_NAMES: Record<
  (typeof SUPPORTED_NETWORKS)[keyof typeof SUPPORTED_NETWORKS],
  string
> = {
  [SUPPORTED_NETWORKS.ETHEREUM]: "Ethereum",
  [SUPPORTED_NETWORKS.OPTIMISM]: "Optimism",
  [SUPPORTED_NETWORKS.BASE]: "Base",
  [SUPPORTED_NETWORKS.ARBITRUM]: "Arbitrum",
  [SUPPORTED_NETWORKS.UNICHAIN]: "Unichain",
};
