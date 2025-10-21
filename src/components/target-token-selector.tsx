"use client";

import { useState } from "react";
import { TARGET_TOKENS } from "@/constants/target-tokens";
import { NETWORK_DISPLAY_NAMES } from "@/constants/networks";
import type { ConversionTarget } from "@/types/conversion";
import { Button } from "@/components/ui/button";

interface TargetTokenSelectorProps {
  onConfirm: (target: ConversionTarget) => void;
  estimatedValue: number;
}

export function TargetTokenSelector({
  onConfirm,
  estimatedValue,
}: TargetTokenSelectorProps) {
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!selectedToken || !selectedNetwork) return;

    const token = TARGET_TOKENS.find((t) => t.symbol === selectedToken);
    if (!token) return;

    onConfirm({
      tokenSymbol: token.symbol,
      tokenName: token.name,
      network: selectedNetwork,
    });
  };

  const selectedTokenData = TARGET_TOKENS.find(
    (t) => t.symbol === selectedToken
  );
  const isValid = selectedToken && selectedNetwork;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6 space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Convert To</h3>
          <p className="text-sm text-muted-foreground">
            Choose your target asset and destination network
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                1
              </div>
              <label className="text-sm font-semibold">
                Select Target Asset
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TARGET_TOKENS.map((token) => (
                <button
                  key={token.symbol}
                  onClick={() => {
                    setSelectedToken(token.symbol);
                    setSelectedNetwork(null);
                  }}
                  className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                    selectedToken === token.symbol
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={token.logo}
                    alt={token.symbol}
                    className="h-8 w-8 rounded-full"
                  />
                  <div className="text-left">
                    <p className="font-medium">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      {token.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedTokenData && (
            <div className="animate-in fade-in-50 duration-300">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    selectedNetwork
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  2
                </div>
                <label className="text-sm font-semibold">
                  Select Destination Network
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {selectedTokenData.networks.map((network) => (
                  <button
                    key={network}
                    onClick={() => setSelectedNetwork(network)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedNetwork === network
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium">
                      {
                        NETWORK_DISPLAY_NAMES[
                          network as keyof typeof NETWORK_DISPLAY_NAMES
                        ]
                      }
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {isValid && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-4 space-y-3 animate-in fade-in-50 duration-300">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                ✓
              </div>
              <span className="text-sm font-semibold">Conversion Summary</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Converting:</span>
              <span className="font-semibold text-lg">
                ${estimatedValue.toFixed(2)}
              </span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">To:</span>
              <div className="text-right">
                <p className="font-semibold">{selectedToken}</p>
                <p className="text-xs text-muted-foreground">
                  on{" "}
                  {
                    NETWORK_DISPLAY_NAMES[
                      selectedNetwork as keyof typeof NETWORK_DISPLAY_NAMES
                    ]
                  }
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleConfirm}
          disabled={!isValid}
          className="w-full"
          size="lg"
        >
          Confirm Conversion
        </Button>
      </div>
    </div>
  );
}
