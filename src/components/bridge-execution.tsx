"use client";

import { useState } from "react";
import { usePrivy, useSendTransaction, useWallets } from "@privy-io/react-auth";
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
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  
  // Force a re-render when wallets change to get updated chain info
  const [walletUpdateTrigger, setWalletUpdateTrigger] = useState(0);
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<BridgeRoute[]>([]);
  const [executionStatus, setExecutionStatus] = useState<
    Record<number, "pending" | "approving" | "executing" | "success" | "error">
  >({});
  const [txHashes, setTxHashes] = useState<Record<number, string>>({});
  const [approvalHashes, setApprovalHashes] = useState<
    Record<number, string[]>
  >({});
  const [switchingChains, setSwitchingChains] = useState<Record<number, boolean>>({});

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
      data.routes.forEach((_: any, idx: number) => {
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

  const getCurrentChainId = async (): Promise<number | null> => {
    if (!wallets || wallets.length === 0) {
      return null;
    }
    
    try {
      // Try to get chain ID from the wallet's provider directly
      const provider = await wallets[0].getEthereumProvider();
      const chainId = await provider.request({ method: 'eth_chainId' });
      return parseInt(chainId, 16);
    } catch (error) {
      console.warn("Failed to get chain ID from provider, falling back to wallet.chainId:", error);
      return parseInt(wallets[0].chainId);
    }
  };

  const ensureCorrectChain = async (requiredChainId: number, routeIndex: number): Promise<boolean> => {
    if (!wallets || wallets.length === 0) {
      console.error("No wallets available");
      return false;
    }

    const currentChainId = await getCurrentChainId();
    console.log(`Current chain: ${currentChainId}, Required chain: ${requiredChainId}`);

    if (currentChainId !== requiredChainId) {
      console.log(`Switching from chain ${currentChainId} to ${requiredChainId}`);
      setSwitchingChains((prev) => ({ ...prev, [routeIndex]: true }));
      
      try {
        // Use the wallet's switchChain method to switch networks
        await wallets[0].switchChain(requiredChainId);
        console.log(`Successfully switched to chain ${requiredChainId}`);
        
        // Wait for the chain switch to complete and verify it worked
        let attempts = 0;
        const maxAttempts = 10;
        let switchCompleted = false;
        
        while (attempts < maxAttempts && !switchCompleted) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check if the chain has actually switched
          const newChainId = await getCurrentChainId();
          console.log(`Chain switch check ${attempts + 1}: Current chain ${newChainId}, Required ${requiredChainId}`);
          
          if (newChainId === requiredChainId) {
            switchCompleted = true;
            console.log(`Chain switch verified after ${attempts + 1} attempts`);
          } else {
            attempts++;
          }
        }
        
        if (!switchCompleted) {
          console.warn(`Chain switch may not have completed properly. Current: ${await getCurrentChainId()}, Required: ${requiredChainId}`);
        }
        
        // Trigger a wallet update to ensure we have the latest chain info
        setWalletUpdateTrigger(prev => prev + 1);
        setSwitchingChains((prev) => ({ ...prev, [routeIndex]: false }));
        return true;
      } catch (error) {
        console.error("Failed to switch chain:", error);
        setSwitchingChains((prev) => ({ ...prev, [routeIndex]: false }));
        return false;
      }
    }

    return true;
  };

  const validateWalletConnection = (): boolean => {
    console.log("Validating wallet connection...");
    console.log("Authenticated:", authenticated);
    console.log("User:", user);
    console.log("User wallet:", user?.wallet);
    console.log("Wallets array:", wallets);
    console.log("Wallets length:", wallets?.length);
    
    if (!authenticated) {
      console.error("User not authenticated");
      return false;
    }
    
    if (!user?.wallet?.address) {
      console.error("No user wallet address found");
      return false;
    }
    
    if (!wallets || wallets.length === 0) {
      console.error("No wallets available in useWallets hook");
      return false;
    }
    
    if (!wallets[0]?.address) {
      console.error("First wallet has no address");
      return false;
    }
    
    // Check if wallet addresses match
    if (user.wallet.address !== wallets[0].address) {
      console.warn("Wallet address mismatch:", {
        userWallet: user.wallet.address,
        walletsWallet: wallets[0].address
      });
    }
    
    console.log("Wallet validation passed");
    return true;
  };

  const refreshWalletState = async (): Promise<void> => {
    console.log("Refreshing wallet state...");
    setWalletUpdateTrigger(prev => prev + 1);
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const executeTransaction = async (routeIndex: number) => {
    console.log(`executeTransaction called for route ${routeIndex}`);
    
    // Validate wallet connection before proceeding
    if (!validateWalletConnection()) {
      console.error("Wallet validation failed");
      setExecutionStatus((prev) => ({ ...prev, [routeIndex]: "error" }));
      return;
    }
    
    const route = routes[routeIndex];
    if (!route.quote) {
      console.log(`No quote found for route ${routeIndex}`);
      return;
    }
    console.log(`Executing transaction for route ${routeIndex} with quote:`, route.quote);

    const chainId = getChainIdFromNetwork(route.sourceNetwork);
    
    // Ensure we're on the correct chain before executing the transaction
    const chainSwitched = await ensureCorrectChain(chainId, routeIndex);
    if (!chainSwitched) {
      console.error(`Failed to switch to chain ${chainId}`);
      setExecutionStatus((prev) => ({ ...prev, [routeIndex]: "error" }));
      return;
    }

    console.log(`Executing transaction on chain ${chainId}`);

    try {
      // Step 1: Execute approval transactions if needed
      if (route.quote.approvalTxns && route.quote.approvalTxns.length > 0) {
        setExecutionStatus((prev) => ({ ...prev, [routeIndex]: "approving" }));

        const approvalTxHashes: string[] = [];
        for (const approvalTx of route.quote.approvalTxns) {
          console.log(`Sending approval transaction to ${approvalTx.to}`);
          
          // Validate wallet before each transaction
          if (!validateWalletConnection()) {
            throw new Error("Wallet validation failed before approval transaction");
          }
          
          const approvalResult = await sendTransaction(
            {
              to: approvalTx.to,
              data: approvalTx.data as `0x${string}`,
              value: BigInt(approvalTx.value || "0"),
              chainId,
            },
            {
              address: wallets[0].address,
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

      console.log(`Sending bridge transaction to ${route.quote.swapTx.to}`);
      
      // Validate wallet before bridge transaction
      if (!validateWalletConnection()) {
        throw new Error("Wallet validation failed before bridge transaction");
      }
      
      const result = await sendTransaction(
        {
          to: route.quote.swapTx.to,
          data: route.quote.swapTx.data as `0x${string}`,
          value: BigInt(route.quote.swapTx.value || "0"),
          chainId,
        },
        {
          address: wallets[0].address,
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
    console.log("Starting executeAllTransactions");
    for (let i = 0; i < routes.length; i++) {
      console.log(`Processing route ${i}, status:`, executionStatus[i]);
      if (routes[i].quote && executionStatus[i] === "pending") {
        console.log(`Executing transaction for route ${i}`);
        console.log(`Route ${i} requires chain:`, getChainIdFromNetwork(routes[i].sourceNetwork));
        console.log(`Current wallet chain:`, wallets && wallets.length > 0 ? wallets[0].chainId : "No wallet");
        
        await executeTransaction(i);
        
        // Add a delay between transactions to ensure wallet state stabilizes
        if (i < routes.length - 1) {
          console.log(`Waiting before next transaction to ensure wallet state is stable...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Re-validate wallet connection after delay
          console.log(`Re-validating wallet connection before next transaction...`);
          if (!validateWalletConnection()) {
            console.log("Wallet validation failed, attempting to refresh wallet state...");
            await refreshWalletState();
            
            if (!validateWalletConnection()) {
              console.error("Wallet validation failed after refresh, stopping execution");
              break;
            } else {
              console.log("Wallet state refreshed successfully");
            }
          }
        }
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
            const isSwitchingChain = switchingChains[idx];
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
                    <p className="text-xs text-muted-foreground">
                      Chain ID: {getChainIdFromNetwork(route.sourceNetwork)}
                      {wallets && wallets.length > 0 && (
                        <span className="ml-2">
                          (Current: {wallets[0].chainId})
                          {parseInt(wallets[0].chainId) !== getChainIdFromNetwork(route.sourceNetwork) && (
                            <span className="text-orange-600 ml-1">⚠️ Network switch required</span>
                          )}
                        </span>
                      )}
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
                    {isSwitchingChain && (
                      <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                        Switching Network...
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
                    disabled={!authenticated || !user?.wallet?.address || isSwitchingChain}
                  >
                    {isSwitchingChain ? "Switching Network..." : "Execute Bridge"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {routes.every((r) => r.quote) &&
          Object.values(executionStatus).some((s) => s === "pending") && (
            <div className="space-y-3">
              {!authenticated && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">
                    ⚠️ Please connect your wallet to execute transactions.
                  </p>
                </div>
              )}
              {authenticated && !user?.wallet?.address && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <p className="text-sm text-yellow-800">
                    ⚠️ No wallet address found. Please reconnect your wallet.
                  </p>
                </div>
              )}
              {authenticated && user?.wallet?.address && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-sm text-blue-800">
                    💡 The app will automatically switch your wallet to the correct network for each transaction. 
                    Youll be prompted to approve network switches when needed.
                  </p>
                </div>
              )}
              <Button
                onClick={executeAllTransactions}
                className="w-full"
                size="lg"
                disabled={!authenticated || !user?.wallet?.address || Object.values(switchingChains).some(Boolean)}
              >
                {Object.values(switchingChains).some(Boolean) ? "Switching Networks..." : "Execute All Bridges"}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
