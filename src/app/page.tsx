"use client";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { TokenConversionManager } from "@/components/token-conversion-manager";

export default function Home() {
  const { ready, authenticated, user, logout, login } = usePrivy();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const walletAddress = user?.wallet?.address;

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      {authenticated ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Token Converter</h1>
              {walletAddress && (
                <p className="text-sm text-muted-foreground mt-1">
                  {walletAddress}
                </p>
              )}
            </div>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
          {walletAddress ? (
            <TokenConversionManager walletAddress={walletAddress} />
          ) : (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-sm text-yellow-800">
                No wallet found. Please connect a wallet.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex min-h-screen items-center justify-center">
          <Button onClick={login} size="lg">
            Login to Convert Tokens
          </Button>
        </div>
      )}
    </div>
  );
}
