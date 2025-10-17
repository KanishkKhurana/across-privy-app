import { NextRequest, NextResponse } from "next/server";
import { getChainIdFromNetwork } from "@/constants/chain-ids";
import type { BridgeRoute } from "@/types/across";

const ACROSS_API_URL = "https://app.across.to/api";

export async function POST(request: NextRequest) {
  try {
    const { routes, depositor } = await request.json();

    if (!routes || !Array.isArray(routes) || !depositor) {
      return NextResponse.json(
        { error: "Routes array and depositor address are required" },
        { status: 400 }
      );
    }

    const bridgeRoutes: BridgeRoute[] = await Promise.all(
      routes.map(async (route: BridgeRoute) => {
        try {
          const originChainId = getChainIdFromNetwork(route.sourceNetwork);
          const destinationChainId = getChainIdFromNetwork(route.targetNetwork);

          const params = new URLSearchParams({
            inputToken: route.sourceToken,
            outputToken: route.targetToken,
            originChainId: originChainId.toString(),
            destinationChainId: destinationChainId.toString(),
            amount: route.sourceAmount,
            depositor: depositor,
            tradeType: "exactInput",
            slippage: "0.005", // 0.5% slippage
          });

          console.log("Fetching route:", {
            inputToken: route.sourceToken,
            outputToken: route.targetToken,
            originChainId,
            destinationChainId,
            amount: route.sourceAmount,
            depositor,
          });

          const url = `${ACROSS_API_URL}/swap/approval?${params}`;
          console.log("Full URL:", url);

          const response = await fetch(url, {
            method: "GET",
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Across API error for route:", {
              originChainId,
              destinationChainId,
              inputToken: route.sourceToken,
              outputToken: route.targetToken,
              status: response.status,
              statusText: response.statusText,
              error: errorText,
            });

            let errorMessage = `Failed to get quote: ${response.statusText}`;
            try {
              const errorJson = JSON.parse(errorText);
              if (errorJson.message) {
                errorMessage = errorJson.message;
              }
            } catch {
              // Use default error message
            }

            return {
              ...route,
              quote: null,
              error: errorMessage,
            };
          }

          const quote = await response.json();

          return {
            ...route,
            quote,
            error: undefined,
          };
        } catch (error) {
          console.error("Error fetching route:", error);
          return {
            ...route,
            quote: null,
            error:
              error instanceof Error ? error.message : "Failed to fetch route",
          };
        }
      })
    );

    return NextResponse.json({ routes: bridgeRoutes });
  } catch (error) {
    console.error("Error processing bridge routes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
