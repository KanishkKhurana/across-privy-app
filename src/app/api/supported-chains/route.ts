import { NextResponse } from "next/server";

const ACROSS_API_URL = "https://app.across.to/api";

export async function GET() {
  try {
    // Fetch supported chains from Across
    const response = await fetch(`${ACROSS_API_URL}/swap/chains`);

    if (!response.ok) {
      throw new Error("Failed to fetch supported chains");
    }

    const chains = await response.json();
    return NextResponse.json({ chains });
  } catch (error) {
    console.error("Error fetching supported chains:", error);
    return NextResponse.json(
      { error: "Failed to fetch supported chains" },
      { status: 500 }
    );
  }
}
