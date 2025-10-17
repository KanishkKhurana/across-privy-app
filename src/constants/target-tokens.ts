export const TARGET_TOKENS = [
  {
    symbol: "USDC",
    name: "USD Coin",
    networks: [
      "eth-mainnet",
      "opt-mainnet",
      "base-mainnet",
      "arb-mainnet",
      "unichain-mainnet",
    ],
    logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    networks: ["eth-mainnet", "opt-mainnet", "arb-mainnet"],
    logo: "https://cryptologos.cc/logos/tether-usdt-logo.png",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    networks: [
      "eth-mainnet",
      "opt-mainnet",
      "base-mainnet",
      "arb-mainnet",
      "unichain-mainnet",
    ],
    logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether",
    networks: [
      "eth-mainnet",
      "opt-mainnet",
      "base-mainnet",
      "arb-mainnet",
      "unichain-mainnet",
    ],
    logo: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png",
  },
] as const;
