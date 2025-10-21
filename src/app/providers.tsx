"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { arbitrum, base, mainnet, optimism, unichain } from "viem/chains";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        loginMethods: ["wallet"],
        supportedChains: [mainnet, unichain, optimism, arbitrum, base],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
