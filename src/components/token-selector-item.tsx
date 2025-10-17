"use client";

import { useState } from "react";
import type { Token } from "@/types/alchemy";
import { Button } from "@/components/ui/button";
import { NETWORK_DISPLAY_NAMES } from "@/constants/networks";

interface TokenSelectorItemProps {
  token: Token;
  onSelect: (token: Token, amount: string) => void;
  onDeselect: (token: Token) => void;
  isSelected: boolean;
  selectedAmount?: string;
}

export function TokenSelectorItem({
  token,
  onSelect,
  onDeselect,
  isSelected,
  selectedAmount = "",
}: TokenSelectorItemProps) {
  const [amount, setAmount] = useState(selectedAmount);
  const [error, setError] = useState<string | null>(null);

  const formatBalance = (balance: string, decimals?: number) => {
    if (!decimals) return balance;
    const value = Number(balance) / Math.pow(10, decimals);
    return value.toFixed(4);
  };

  const maxBalance = formatBalance(
    token.tokenBalance,
    token.tokenMetadata?.decimals
  );

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setError(null);

    if (!value || parseFloat(value) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    const inputAmount = parseFloat(value);
    const max = parseFloat(maxBalance);

    if (inputAmount > max) {
      setError(`Amount exceeds balance (max: ${maxBalance})`);
      return;
    }

    onSelect(token, value);
  };

  const handleMaxClick = () => {
    setAmount(maxBalance);
    setError(null);
    onSelect(token, maxBalance);
  };

  const handleToggle = () => {
    if (isSelected) {
      onDeselect(token);
      setAmount("");
      setError(null);
    } else {
      const defaultAmount = amount || maxBalance;
      setAmount(defaultAmount);
      onSelect(token, defaultAmount);
    }
  };

  const formatPrice = () => {
    const price = token.tokenPrices?.[0];
    if (!price) return null;
    return `$${parseFloat(price.value).toFixed(2)}`;
  };

  return (
    <div
      className={`rounded-lg border p-4 transition-all ${
        isSelected ? "border-primary bg-primary/5" : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          {token.tokenMetadata?.logo ? (
            <img
              src={token.tokenMetadata.logo}
              alt={token.tokenMetadata.symbol}
              className="h-10 w-10 rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-semibold text-muted-foreground">
                {token.tokenMetadata?.symbol?.substring(0, 3)}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium">
                {token.tokenMetadata?.name || "Unknown Token"}
              </p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                {
                  NETWORK_DISPLAY_NAMES[
                    token.network as keyof typeof NETWORK_DISPLAY_NAMES
                  ]
                }
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {token.tokenMetadata?.symbol || "???"} • Balance: {maxBalance}
            </p>
            {formatPrice() && (
              <p className="text-sm text-muted-foreground">{formatPrice()}</p>
            )}
          </div>
        </div>
        <Button
          onClick={handleToggle}
          variant={isSelected ? "default" : "outline"}
          size="sm"
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      </div>

      {isSelected && (
        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">Amount to convert</label>
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.0"
                step="any"
                min="0"
                max={maxBalance}
                className={`w-full rounded-md border px-3 py-2 text-sm ${
                  error ? "border-red-500" : ""
                }`}
              />
              {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
            </div>
            <Button onClick={handleMaxClick} variant="outline" size="sm">
              Max
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
