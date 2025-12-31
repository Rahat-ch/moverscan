# CLAUDE.md

Moverscan - Block explorer for Movement Network mainnet.

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # Run ESLint
```

## Tech Stack

- Next.js 15 (App Router)
- React 19, TypeScript
- Tailwind CSS v4
- TanStack Query (data fetching/caching)
- Aptos Wallet Adapter (Nightly, Razor)
- graphql-request (indexer queries)

## Architecture

**Routing**: Single page with query params:
- `/?tx={version}` - Transaction detail
- `/?address={addr}` - Account detail (4 tabs)
- `/?block={height}` - Block detail

**Data Sources**:
- GraphQL Indexer: `https://indexer.mainnet.movementnetwork.xyz/v1/graphql`
- RPC: `https://mainnet.movementnetwork.xyz/v1`

## Key Files

| File | Purpose |
|------|---------|
| `lib/graphql/queries.ts` | All GraphQL queries + TypeScript types |
| `lib/rpc/client.ts` | Module ABIs, view function execution |
| `lib/format.ts` | Address truncation, timestamps, MOVE formatting |
| `components/account-detail.tsx` | Tabs: transactions, tokens, NFTs, modules |
| `components/module-runner.tsx` | Execute view/entry functions with wallet |
| `spec.md` | Full specification with schema notes |

## Movement vs Aptos Differences

- Transactions use `version` not `hash`
- No `gas_used` field - only `max_gas_amount`
- Timestamp field is `timestamp` not `transaction_timestamp`
- NFT queries lack nested `current_token_data` relationship

## Common Tasks

**Add GraphQL query**: Add to `lib/graphql/queries.ts` with interface + gql template

**Add new view**: Create component, add query param check in `app/page.tsx`

**Test queries**: Use Hasura GraphiQL at indexer URL

## Path Aliases

`@/*` maps to project root (e.g., `@/components`, `@/lib/format`)
