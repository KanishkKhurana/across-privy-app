# Debugging Guide

## Getting "Bad Request" Errors from Across API

### Step 1: Check Server Logs

When you get "Bad Request" errors, check your terminal where `pnpm dev` is running. The enhanced logging will show:

```
Fetching route: {
  originChainId: 1,
  destinationChainId: 8453,
  inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  outputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  amount: '1000000'
}
```

And the error details:

```
Across API error for route: {
  originChainId: 1,
  destinationChainId: 8453,
  inputToken: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  outputToken: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  status: 400,
  statusText: 'Bad Request',
  error: '<full error message from Across>'
}
```

### Step 2: Verify Supported Networks

Check which networks Across currently supports:

**Via API:**

```bash
# Check supported chains
curl https://app.across.to/api/swap/chains

# Check available routes
curl https://app.across.to/api/available-routes
```

**Via Your App:**

```
http://localhost:3000/api/supported-chains
http://localhost:3000/api/supported-routes
```

### Step 3: Common Issues and Solutions

#### Issue: "Network Not Supported"

**Problem:** Unichain or another network isn't supported by Across yet.

**Solution:**

- Check `/swap/chains` endpoint to see supported networks
- Remove unsupported networks from your `SUPPORTED_NETWORKS` in `src/constants/networks.ts`
- Or filter them out in the UI

#### Issue: "Invalid Token Address"

**Problem:** Token address doesn't exist or isn't supported on that network.

**Solution:**

- Verify token addresses from block explorers:
  - Ethereum: https://etherscan.io
  - Base: https://basescan.org
  - Optimism: https://optimistic.etherscan.io
  - Arbitrum: https://arbiscan.io
- Check `/available-routes` to see which token pairs are supported
- Ensure addresses are checksummed (proper capitalization)

#### Issue: "Amount Too Low"

**Problem:** Transfer amount is below minimum.

**Solution:**

- Check `/limits` endpoint for minimum amounts:

```bash
curl "https://app.across.to/api/limits?inputToken=0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48&outputToken=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&originChainId=1&destinationChainId=8453"
```

#### Issue: "Unsupported Route"

**Problem:** Across doesn't support bridging that specific token pair between those networks.

**Solution:**

- Check available routes with specific filters:

```bash
# Check routes from Ethereum
curl "https://app.across.to/api/available-routes?originChainId=1"

# Check routes to Base
curl "https://app.across.to/api/available-routes?destinationChainId=8453"
```

### Step 4: Test with Known Good Routes

Try these known working routes on mainnet:

**USDC: Ethereum → Base**

```typescript
{
  inputToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC on Ethereum
  outputToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base
  originChainId: 1,
  destinationChainId: 8453,
  amount: "1000000" // 1 USDC (6 decimals)
}
```

**ETH: Ethereum → Optimism**

```typescript
{
  inputToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH on Ethereum
  outputToken: "0x4200000000000000000000000000000000000006", // WETH on Optimism
  originChainId: 1,
  destinationChainId: 10,
  amount: "10000000000000000" // 0.01 ETH (18 decimals)
}
```

### Step 5: Use Testnet for Testing

Switch to testnet to avoid real funds while debugging:

1. Update `src/app/api/bridge/route.ts`:

```typescript
const ACROSS_API_URL = "https://testnet.across.to/api";
```

2. Use testnet chain IDs:

```typescript
export const CHAIN_ID_MAP: Record<string, number> = {
  "eth-mainnet": 11155111, // Sepolia
  "base-mainnet": 84532, // Base Sepolia
  "opt-mainnet": 11155420, // OP Sepolia
  "arb-mainnet": 421614, // Arbitrum Sepolia
};
```

3. Get testnet tokens from faucets and test!

## Quick Diagnostics Checklist

- [ ] Check server logs for detailed error message
- [ ] Verify network is in `/swap/chains`
- [ ] Verify route exists in `/available-routes`
- [ ] Check token addresses are correct for each network
- [ ] Verify amount meets minimum via `/limits`
- [ ] Try a known working route first
- [ ] Test on testnet if issues persist
