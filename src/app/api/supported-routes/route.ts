import { NextResponse } from "next/server";

const ACROSS_API_URL = "https://app.across.to/api";

export async function GET() {
  try {
    // Fetch available routes from Across
    const response = await fetch(`${ACROSS_API_URL}/available-routes`);

    if (!response.ok) {
      throw new Error("Failed to fetch available routes");
    }

    const routes = await response.json();
    return NextResponse.json({ routes });
  } catch (error) {
    console.error("Error fetching available routes:", error);
    return NextResponse.json(
      { error: "Failed to fetch available routes" },
      { status: 500 }
    );
  }
}
