# Moverscan

Block explorer for Movement Network mainnet. Etherscan-style UI for exploring transactions, accounts, blocks, and smart contract modules.

## Features

- **Transaction Explorer** - Browse latest transactions with pagination
- **Transaction Details** - View tx info, method calls, gas, events
- **Account Pages** - Transactions, token balances, NFTs, deployed modules
- **Block Explorer** - Block metadata and transactions in block
- **Module Viewer** - View ABI, run view/entry functions
- **Wallet Integration** - Connect Nightly or Razor wallet
- **Dark/Light Theme** - Toggle with persistent preference

## Tech Stack

- Next.js 15 (App Router)
- React 19, TypeScript
- Tailwind CSS v4
- TanStack Query
- Aptos Wallet Adapter
- GraphQL (Movement Indexer)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Endpoints

No API keys required. Uses public endpoints:

| Service | URL |
|---------|-----|
| Indexer | `https://indexer.mainnet.movementnetwork.xyz/v1/graphql` |
| RPC | `https://mainnet.movementnetwork.xyz/v1` |

## Project Structure

```
app/
  page.tsx              # Main page with routing via query params
  layout.tsx            # Root layout with providers
  globals.css           # Tailwind styles

components/
  header.tsx            # Nav with theme toggle + wallet
  search-bar.tsx        # Universal search
  transaction-list.tsx  # Homepage tx table
  transaction-detail.tsx
  account-detail.tsx    # Tabs: txs, tokens, nfts, modules
  block-detail.tsx
  theme-toggle.tsx
  wallet-connect.tsx
  module-runner.tsx     # Execute view/entry functions

lib/
  graphql/
    client.ts           # GraphQL client
    queries.ts          # All indexer queries
  rpc/
    client.ts           # RPC client for modules
  format.ts             # Address, time, MOVE formatting

providers/
  query-provider.tsx    # TanStack Query
  theme-provider.tsx    # next-themes
  wallet-provider.tsx   # Aptos Wallet Adapter
```

## URL Routes

All routing via query params on `/`:

| Route | Example |
|-------|---------|
| Homepage | `/` |
| Transaction | `/?tx=49287238` |
| Account | `/?address=0x1234...` |
| Block | `/?block=15571774` |

## Deployment

```bash
npm run build
```

Deploy to Vercel, Netlify, or any Node.js host. No env variables required.

## Movement-Specific Notes

- Transactions identified by `version` number (not hash like Ethereum)
- Indexer schema differs from standard Aptos (see `spec.md`)
- All addresses are 64-char hex with `0x` prefix

## License

Apache 2.0 - See [LICENSE](LICENSE)
