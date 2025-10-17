import { NextRequest, NextResponse } from "next/server";
import type { TokensByAddressRequest, TokensResponse } from "@/types/alchemy";

export async function POST(request: NextRequest) {
  try {
    const { address, networks } = await request.json();

    if (!address || !networks || !Array.isArray(networks)) {
      return NextResponse.json(
        { error: "Address and networks are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Alchemy API key not configured" },
        { status: 500 }
      );
    }

    const requestBody: TokensByAddressRequest = {
      addresses: [
        {
          address,
          networks,
        },
      ],
      withMetadata: true,
      withPrices: true,
      includeNativeTokens: true,
      includeErc20Tokens: true,
    };

    const response = await fetch(
      `https://api.g.alchemy.com/data/v1/${apiKey}/assets/tokens/by-address`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Alchemy API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch tokens from Alchemy" },
        { status: response.status }
      );
    }

    const data: TokensResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching tokens:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
