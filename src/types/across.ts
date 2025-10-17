export interface AcrossSwapQuote {
  inputToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  outputToken: {
    address: string;
    symbol: string;
    decimals: number;
  };
  inputAmount: string;
  expectedOutputAmount: string;
  minOutputAmount: string;
  fees: {
    total: {
      amount: string;
      amountUsd: string;
      pct: string;
    };
  };
  expectedFillTime: number;
  approvalTxns?: Array<{
    chainId: number;
    to: string;
    data: string;
    value?: string;
    gas?: string;
  }>;
  swapTx: {
    chainId: number;
    to: string;
    data: string;
    value?: string;
    gas?: string;
  };
}

export interface BridgeRoute {
  sourceToken: string;
  sourceNetwork: string;
  sourceAmount: string;
  targetToken: string;
  targetNetwork: string;
  quote: AcrossSwapQuote | null;
  error?: string;
}
