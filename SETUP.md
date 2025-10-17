# Setup Instructions

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here

# Alchemy API Key
ALCHEMY_API_KEY=your_alchemy_api_key_here
```

## Across Protocol Integration

### Integrator ID (Optional but Recommended)

To use Across Protocol's bridge API with your own integrator ID:

1. Fill out the [Across Integrator Form](https://docs.google.com/forms/d/e/1FAIpQLSe-HY6mzTeGZs91HxObkQmwkMQuH7oy8ngZ1ROiu-f4SR4oMw/viewform)
2. You'll receive a 2-byte hex-string integrator ID (e.g., "0xdead")
3. Add it to the bridge API call in `src/app/api/bridge/route.ts`:

```typescript
const params = new URLSearchParams({
  // ... existing params
  integratorId: "0xYOUR_ID", // Add this line
});
```

### Token Address Mapping

The current implementation has a simplified token address mapping in `bridge-execution.tsx`. You'll need to add the actual token contract addresses for each network.

Example token addresses:

- **USDC on Ethereum**: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`
- **USDC on Optimism**: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`
- **USDC on Base**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **USDC on Arbitrum**: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`

## Chain IDs

Current chain ID mappings (in `src/constants/chain-ids.ts`):

- Ethereum: 1
- Optimism: 10
- Base: 8453
- Arbitrum: 42161
- Unichain: 1301

## Testing

It's recommended to test on testnet first. Use the testnet Across API:

```
https://testnet.across.to/api
```

Testnet fills typically take around 1 minute, slower than mainnet's 2-second fills.
