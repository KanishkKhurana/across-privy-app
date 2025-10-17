import type { Token } from "./alchemy";

export interface SelectedToken {
  token: Token;
  amount: string;
  network: string;
}

export interface ConversionSelection {
  selectedTokens: SelectedToken[];
  totalValue: number;
}

export interface ConversionTarget {
  tokenSymbol: string;
  tokenName: string;
  network: string;
}
