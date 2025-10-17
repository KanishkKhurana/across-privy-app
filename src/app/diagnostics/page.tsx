"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DiagnosticsPage() {
  const [chains, setChains] = useState<any>(null);
  const [routes, setRoutes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchChains = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/supported-chains");
      const data = await response.json();
      setChains(data);
    } catch (error) {
      console.error("Error fetching chains:", error);
      setChains({ error: "Failed to fetch chains" });
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/supported-routes");
      const data = await response.json();
      setRoutes(data);
    } catch (error) {
      console.error("Error fetching routes:", error);
      setRoutes({ error: "Failed to fetch routes" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Across Protocol Diagnostics</h1>

      <div className="space-y-6">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Supported Chains</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Check which networks are supported by Across Protocol
          </p>
          <Button onClick={fetchChains} disabled={loading} className="mb-4">
            {loading ? "Loading..." : "Fetch Supported Chains"}
          </Button>
          {chains && (
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
              {JSON.stringify(chains, null, 2)}
            </pre>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Available Routes</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Check which token routes are available for bridging
          </p>
          <Button onClick={fetchRoutes} disabled={loading} className="mb-4">
            {loading ? "Loading..." : "Fetch Available Routes"}
          </Button>
          {routes && (
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
              {JSON.stringify(routes, null, 2)}
            </pre>
          )}
        </div>

        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">Debugging Tips</h3>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>
              If you get "Bad Request" errors, check the server logs in your
              terminal
            </li>
            <li>
              Verify your source/destination networks are in the supported
              chains list
            </li>
            <li>
              Check if your token pair and network combination exists in
              available routes
            </li>
            <li>
              Unichain mainnet may not be supported yet - check the chains list
            </li>
            <li>See DEBUGGING.md for comprehensive troubleshooting guide</li>
          </ul>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Your Current Config</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold">Chain IDs:</span>
              <pre className="bg-muted p-2 rounded mt-1">
                {`{
  "eth-mainnet": 1,
  "opt-mainnet": 10,
  "base-mainnet": 8453,
  "arb-mainnet": 42161,
  "unichain-mainnet": 130
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
