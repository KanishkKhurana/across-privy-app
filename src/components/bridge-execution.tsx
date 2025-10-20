"use client";

import { useState } from "react";
import { usePrivy, useSendTransaction } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { NETWORK_DISPLAY_NAMES } from "@/constants/networks";
import { getChainIdFromNetwork } from "@/constants/chain-ids";
import type { SelectedToken, ConversionTarget } from "@/types/conversion";
import type { BridgeRoute } from "@/types/across";

interface BridgeExecutionProps {
  selectedTokens: SelectedToken[];
  target: ConversionTarget;
  onBack: () => void;
}

export function BridgeExecution({
  selectedTokens,
  target,
  onBack,
}: BridgeExecutionProps) {
  const { user } = usePrivy();
  const { sendTransaction } = useSendTransaction();
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<BridgeRoute[]>([]);
  const [executionStatus, setExecutionStatus] = useState<
    Record<number, "pending" | "approving" | "executing" | "success" | "error">
  >({});
  const [txHashes, setTxHashes] = useState<Record<number, string>>({});
  const [approvalHashes, setApprovalHashes] = useState<
    Record<number, string[]>
  >({});

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const bridgeRoutes: BridgeRoute[] = selectedTokens.map((st) => {
        const amountInWei = (
          parseFloat(st.amount) *
          Math.pow(10, st.token.tokenMetadata?.decimals || 18)
        ).toString();

        return {
          sourceToken: st.token.tokenAddress,
          sourceNetwork: st.network,
          sourceAmount: amountInWei,
          targetToken: getTargetTokenAddress(),
          targetNetwork: target.network,
          quote: null,
        };
      });

      const response = await fetch("/api/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          routes: bridgeRoutes,
          depositor: user?.wallet?.address,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bridge routes");
      }

      const data = await response.json();
      setRoutes(data.routes);

      // Initialize execution status
      const status: Record<number, "pending"> = {};
      data.routes.forEach((idx: number) => {
        status[idx] = "pending";
      });
      setExecutionStatus(status);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTargetTokenAddress = (): string => {
    // TODO: Map target token symbols to addresses per network
    // This is a simplified version - you'd need actual token addresses
    const tokenAddresses: Record<string, Record<string, string>> = {
      USDC: {
        "eth-mainnet": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "opt-mainnet": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
        "base-mainnet": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
        "arb-mainnet": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        "unichain-mainnet": "0x078d782b760474a361dda0af3839290b0ef57ad6",
      },
    };

    return tokenAddresses[target.tokenSymbol]?.[target.network] || "";
  };

  const executeTransaction = async (routeIndex: number) => {
    const route = routes[routeIndex];
    if (!route.quote) return;

    const chainId = getChainIdFromNetwork(route.sourceNetwork);

    try {
      // Step 1: Execute approval transactions if needed
      if (route.quote.approvalTxns && route.quote.approvalTxns.length > 0) {
        setExecutionStatus((prev) => ({ ...prev, [routeIndex]: "approving" }));

        const approvalTxHashes: string[] = [];
        for (const approvalTx of route.quote.approvalTxns) {
          const approvalResult = await sendTransaction(
            {
              to: approvalTx.to,
              data: approvalTx.data as `0x${string}`,
              value: BigInt(approvalTx.value || "0"),
              chainId,
            },
            {
              sponsor: true,
              uiOptions: {
                showWalletUIs: false,
              },
            }
          );
          approvalTxHashes.push(approvalResult.hash);
          console.log("Approval tx:", approvalResult.hash);
        }

        setApprovalHashes((prev) => ({
          ...prev,
          [routeIndex]: approvalTxHashes,
        }));
      }

      // Step 2: Execute the bridge transaction
      setExecutionStatus((prev) => ({ ...prev, [routeIndex]: "executing" }));

      const result = await sendTransaction(
        {
          to: route.quote.swapTx.to,
          data: route.quote.swapTx.data as `0x${string}`,
          value: BigInt(route.quote.swapTx.value || "0"),
          chainId,
        },
        {
          sponsor: true,
          uiOptions: {
            showWalletUIs: false,
          },
        }
      );

      setTxHashes((prev) => ({ ...prev, [routeIndex]: result.hash }));
      setExecutionStatus((prev) => ({ ...prev, [routeIndex]: "success" }));
    } catch (error) {
      console.error("Transaction error:", error);
      setExecutionStatus((prev) => ({ ...prev, [routeIndex]: "error" }));
    }
  };

  const executeAllTransactions = async () => {
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].quote && executionStatus[i] === "pending") {
        await executeTransaction(i);
      }
    }
  };

  if (routes.length === 0) {
    return (
      <div className="space-y-6">
        <Button onClick={onBack} variant="outline">
          ← Back
        </Button>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h3 className="text-xl font-semibold">Bridge Routes</h3>
          <p className="text-sm text-muted-foreground">
            Click below to fetch optimal bridge routes for your conversion
          </p>

          <div className="space-y-3">
            {selectedTokens.map((st, idx) => (
              <div key={idx} className="rounded-lg bg-muted p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {st.token.tokenMetadata?.symbol}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {
                        NETWORK_DISPLAY_NAMES[
                          st.network as keyof typeof NETWORK_DISPLAY_NAMES
                        ]
                      }{" "}
                      →{" "}
                      {
                        NETWORK_DISPLAY_NAMES[
                          target.network as keyof typeof NETWORK_DISPLAY_NAMES
                        ]
                      }
                    </p>
                  </div>
                  <p className="text-lg font-semibold">{st.amount}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={fetchRoutes}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Fetching Routes..." : "Get Bridge Routes"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button onClick={onBack} variant="outline">
        ← Back
      </Button>

      <div className="rounded-lg border bg-card p-6 space-y-4">
        <h3 className="text-xl font-semibold">Execute Bridges</h3>

        <div className="space-y-3">
          {routes.map((route, idx) => {
            const status = executionStatus[idx];
            const txHash = txHashes[idx];
            const approvalTxHashes = approvalHashes[idx];
            const needsApproval =
              route.quote?.approvalTxns && route.quote.approvalTxns.length > 0;

            return (
              <div key={idx} className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {route.quote?.inputToken.symbol} →{" "}
                      {route.quote?.outputToken.symbol}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {
                        NETWORK_DISPLAY_NAMES[
                          route.sourceNetwork as keyof typeof NETWORK_DISPLAY_NAMES
                        ]
                      }{" "}
                      →{" "}
                      {
                        NETWORK_DISPLAY_NAMES[
                          route.targetNetwork as keyof typeof NETWORK_DISPLAY_NAMES
                        ]
                      }
                    </p>
                    {needsApproval && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ⚠️ Requires approval
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {status === "pending" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                    {status === "approving" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                        Approving...
                      </span>
                    )}
                    {status === "executing" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        Executing...
                      </span>
                    )}
                    {status === "success" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                        Success
                      </span>
                    )}
                    {status === "error" && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                        Error
                      </span>
                    )}
                  </div>
                </div>

                {route.error && (
                  <p className="text-sm text-red-600">{route.error}</p>
                )}

                {route.quote && (
                  <div className="text-sm space-y-1">
                    <p>
                      Expected Output:{" "}
                      {(
                        Number(route.quote.expectedOutputAmount) /
                        Math.pow(10, route.quote.outputToken.decimals)
                      ).toFixed(6)}{" "}
                      {route.quote.outputToken.symbol}
                    </p>
                    <p className="text-muted-foreground">
                      Fee: $
                      {parseFloat(route.quote.fees.total.amountUsd).toFixed(2)}
                    </p>
                    <p className="text-muted-foreground">
                      Est. Time: ~{route.quote.expectedFillTime}s
                    </p>
                  </div>
                )}

                {approvalTxHashes && approvalTxHashes.length > 0 && (
                  <div className="text-xs space-y-1">
                    <p className="font-medium">Approval TXs:</p>
                    {approvalTxHashes.map((hash, i) => (
                      <p key={i} className="text-muted-foreground break-all">
                        {hash}
                      </p>
                    ))}
                  </div>
                )}

                {txHash && (
                  <p className="text-xs text-muted-foreground break-all">
                    Bridge TX: {txHash}
                  </p>
                )}

                {route.quote && status === "pending" && (
                  <Button
                    onClick={() => executeTransaction(idx)}
                    size="sm"
                    className="w-full"
                  >
                    Execute Bridge
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {routes.every((r) => r.quote) &&
          Object.values(executionStatus).some((s) => s === "pending") && (
            <Button
              onClick={executeAllTransactions}
              className="w-full"
              size="lg"
            >
              Execute All Bridges
            </Button>
          )}
      </div>
    </div>
  );
}
