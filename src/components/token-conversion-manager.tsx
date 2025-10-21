"use client";

import { useEffect, useState } from "react";
import { SUPPORTED_NETWORKS } from "@/constants/networks";
import type { Token } from "@/types/alchemy";
import type { SelectedToken, ConversionTarget } from "@/types/conversion";
import { TokenSelectorItem } from "./token-selector-item";
import { TargetTokenSelector } from "./target-token-selector";
import { BridgeExecution } from "./bridge-execution";
import { Button } from "@/components/ui/button";

interface TokenConversionManagerProps {
  walletAddress: string;
}

export function TokenConversionManager({
  walletAddress,
}: TokenConversionManagerProps) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<
    Map<string, SelectedToken>
  >(new Map());
  const [showTargetSelector, setShowTargetSelector] = useState(false);
  const [showBridgeExecution, setShowBridgeExecution] = useState(false);
  const [confirmedTarget, setConfirmedTarget] =
    useState<ConversionTarget | null>(null);

  useEffect(() => {
    const fetchTokenBalances = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: walletAddress,
            networks: [
              SUPPORTED_NETWORKS.ETHEREUM,
              SUPPORTED_NETWORKS.OPTIMISM,
              SUPPORTED_NETWORKS.BASE,
              SUPPORTED_NETWORKS.ARBITRUM,
              SUPPORTED_NETWORKS.UNICHAIN,
            ],
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch token balances");
        }

        const data = await response.json();
        // Filter out tokens with zero balance or missing essential metadata
        const validTokens = data.data.tokens.filter((token: Token) => {
          const hasBalance = Number(token.tokenBalance) > 0;
          const hasSymbol = token.tokenMetadata?.symbol;
          return hasBalance && hasSymbol;
        });
        setTokens(validTokens);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchTokenBalances();
  }, [walletAddress]);

  const getTokenKey = (token: Token) => {
    return `${token.network}-${token.tokenAddress}`;
  };

  const handleSelectToken = (token: Token, amount: string) => {
    const key = getTokenKey(token);
    const newSelected = new Map(selectedTokens);
    newSelected.set(key, {
      token,
      amount,
      network: token.network,
    });
    setSelectedTokens(newSelected);
  };

  const handleDeselectToken = (token: Token) => {
    const key = getTokenKey(token);
    const newSelected = new Map(selectedTokens);
    newSelected.delete(key);
    setSelectedTokens(newSelected);
  };

  const calculateTotalValue = () => {
    let total = 0;
    selectedTokens.forEach((selected) => {
      const price = selected.token.tokenPrices?.[0];
      if (price) {
        const value = parseFloat(selected.amount) * parseFloat(price.value);
        total += value;
      }
    });
    return total;
  };

  const handleProceed = () => {
    setShowTargetSelector(true);
  };

  const handleConfirmConversion = (target: ConversionTarget) => {
    setConfirmedTarget(target);
    setShowTargetSelector(false);
    setShowBridgeExecution(true);
  };

  const handleBackToSelection = () => {
    setShowTargetSelector(false);
  };

  const handleBackFromExecution = () => {
    setShowBridgeExecution(false);
    setShowTargetSelector(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading tokens...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (showBridgeExecution && confirmedTarget) {
    return (
      <BridgeExecution
        selectedTokens={Array.from(selectedTokens.values())}
        target={confirmedTarget}
        onBack={handleBackFromExecution}
      />
    );
  }

  if (showTargetSelector) {
    return (
      <div className="space-y-6">
        <Button onClick={handleBackToSelection} variant="outline">
          ← Back to Selection
        </Button>
        <TargetTokenSelector
          onConfirm={handleConfirmConversion}
          estimatedValue={calculateTotalValue()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Select Tokens to Convert</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Choose tokens from your portfolio and specify amounts
        </p>
      </div>

      {tokens.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No tokens with balance found</p>
          <p className="text-sm mt-2">
            Tokens must have a balance and symbol to be displayed
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tokens.filter((item)=> !item.tokenMetadata?.name.includes("✅")).map((token) => {
            const key = getTokenKey(token);
            const selected = selectedTokens.get(key);
            return (
              <TokenSelectorItem
                key={key}
                token={token}
                onSelect={handleSelectToken}
                onDeselect={handleDeselectToken}
                isSelected={selectedTokens.has(key)}
                selectedAmount={selected?.amount}
              />
            );
          })}
        </div>
      )}

      {selectedTokens.size > 0 && (
        <div className="sticky bottom-0 bg-background border-t pt-4 mt-6">
          <div className="rounded-lg bg-muted p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-medium">Selected Tokens:</span>
              <span>{selectedTokens.size}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Estimated Total Value:</span>
              <span className="text-lg font-bold">
                ${calculateTotalValue().toFixed(2)}
              </span>
            </div>
            <Button onClick={handleProceed} className="w-full" size="lg">
              Continue to Target Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
