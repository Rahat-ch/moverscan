# Moverscan - Detailed Specification

## Overview
Movement blockchain explorer (Etherscan clone) for Movement Network mainnet.

## Endpoints
- **Indexer (primary)**: `https://indexer.mainnet.movementnetwork.xyz/v1/graphql`
- **RPC (fallback)**: `https://mainnet.movementnetwork.xyz/v1`

## Tech Stack
- Next.js 16 (App Router, RSC)
- React 19, TypeScript
- Tailwind CSS v4 + shadcn/ui
- TanStack Query (caching/state)
- Aptos Wallet Adapter (wallet connection)
- Server-side GraphQL queries (Next.js server components)

---

## Schema Notes (Movement-Specific)

The Movement indexer differs from standard Aptos indexer in key ways:

### `user_transactions` table
| Standard Aptos | Movement Indexer |
|----------------|------------------|
| `hash` | NOT AVAILABLE - use `version` as tx identifier |
| `gas_used` | NOT AVAILABLE - only `max_gas_amount` |
| `transaction_timestamp` | Use `timestamp` instead |
| `vm_status` | NOT AVAILABLE |

**Available fields**: `version`, `sender`, `timestamp`, `gas_unit_price`, `max_gas_amount`, `block_height`, `entry_function_id_str`, `epoch`, `sequence_number`

### `current_token_ownerships_v2` table
| Standard Aptos | Movement Indexer |
|----------------|------------------|
| `collection_id` | NOT AVAILABLE |
| `current_token_data` (nested) | NOT AVAILABLE - no relationship |

**Available fields**: `token_data_id`, `amount`, `last_transaction_version`, `owner_address`

### Transaction Identification
- Transactions identified by `version` number, NOT hash
- Use RPC `GET /transactions/by_hash/{hash}` if hash lookup needed

---

## Pages & Routes

### Homepage (`/`)
- **Search bar** (universal, top)
- **Latest transactions list** (25 per page, numbered pagination)
- No stats banner (minimal header)
- Static data, manual refresh

### Transaction Detail (`/?tx={version}`)
- Mimic Etherscan layout
- Fields: version, status, block, timestamp, from, to, value, gas (in MOVE)
- Decoded payload: `module::function(args)` with toggle to raw JSON
- Events list (raw JSON, collapsible)
- State changes

### Account Detail (`/?address={addr}`)
- **Layout**: Summary card + tabs (Etherscan style)
- **Tabs**:
  - Transactions (paginated, 25/page)
  - Tokens (non-zero balances only, tooltip on click)
  - NFTs (grid with images, lazy load, placeholder on fail)
  - Modules (if account has published modules)

### Block Detail (`/?block={height}`)
- Block metadata: height, timestamp, proposer, epoch, round
- All transactions in block (virtual scroll for large blocks)

### Module View (`/?address={addr}&module={name}`)
- Module ABI (function signatures only)
- **Run tab**: Execute view/entry functions
  - Smart input parsing for complex types
  - Wallet connection via Aptos Wallet Adapter
  - Toast + tx link on execution

---

## UI/UX Decisions

| Feature | Decision |
|---------|----------|
| Pagination | Numbered pages (offset-based) |
| Address display | Truncated `0x1234...5678`, full on hover |
| Timestamps | Relative only ("5 mins ago") |
| Gas display | MOVE token value (calculated) |
| Theme | Dark/light toggle, persist preference |
| Mobile | Mobile-first responsive |
| Empty states | Helpful guidance with suggestions |
| NFT images | Grid, lazy load, placeholder on fail |
| URL routing | Query params (`?tx=`, `?address=`, `?block=`) |

---

## Search Logic
**Auto-detect input type**:
- Numeric only -> Transaction version OR Block height (query both, show results)
- Starts with `0x` + 64 chars -> Address (query account)
- Starts with `0x` + 66 chars -> Could be tx hash (use RPC fallback)
- Otherwise -> Show "invalid format" guidance

**Note**: Since Movement indexer lacks `hash` field, search by hash requires RPC:
```
GET /transactions/by_hash/{hash}
```

---

## Error Handling
- **Indexer down**: Fallback to RPC
- **Invalid search**: Helpful message + format suggestions
- **Failed NFT images**: Generic placeholder icon

---

## GraphQL Queries

### Homepage - Latest Transactions
```graphql
query LatestTransactions($limit: Int!, $offset: Int!) {
  user_transactions(
    limit: $limit
    offset: $offset
    order_by: {version: desc}
  ) {
    version
    sender
    timestamp
    gas_unit_price
    max_gas_amount
    block_height
    entry_function_id_str
  }
}
```

### Transaction by Version
```graphql
query TransactionByVersion($version: bigint!) {
  user_transactions(where: {version: {_eq: $version}}) {
    version
    sender
    sequence_number
    max_gas_amount
    gas_unit_price
    block_height
    timestamp
    entry_function_id_str
    epoch
  }
}
```

### Transaction Events
```graphql
query TransactionEvents($version: bigint!) {
  events(
    where: {transaction_version: {_eq: $version}}
    order_by: {event_index: asc}
  ) {
    transaction_version
    event_index
    account_address
    type
    data
    sequence_number
    creation_number
  }
}
```

### Account Transactions
```graphql
query AccountTransactions($address: String!, $limit: Int!, $offset: Int!) {
  account_transactions(
    where: {account_address: {_eq: $address}}
    limit: $limit
    offset: $offset
    order_by: {transaction_version: desc}
  ) {
    transaction_version
  }
}
# Then fetch full tx data by version
```

### Account Token Balances (Non-zero)
```graphql
query AccountTokens($address: String!) {
  current_fungible_asset_balances(
    where: {
      owner_address: {_eq: $address}
      amount: {_gt: "0"}
    }
  ) {
    owner_address
    asset_type
    amount
    last_transaction_version
  }
}
```

### Token Metadata
```graphql
query TokenMetadata($assetType: String!) {
  fungible_asset_metadata(where: {asset_type: {_eq: $assetType}}) {
    asset_type
    name
    symbol
    decimals
    icon_uri
  }
}
```

### Account NFTs
```graphql
query AccountNFTs($address: String!) {
  current_token_ownerships_v2(
    where: {
      owner_address: {_eq: $address}
      amount: {_gt: "0"}
    }
  ) {
    token_data_id
    amount
    last_transaction_version
    owner_address
  }
}
# Note: No nested current_token_data - fetch token metadata separately if needed
```

### NFT Token Data (separate query)
```graphql
query NFTTokenData($tokenDataId: String!) {
  current_token_datas_v2(where: {token_data_id: {_eq: $tokenDataId}}) {
    token_data_id
    token_name
    token_uri
    description
    collection_id
  }
}
```

### Block by Height
```graphql
query BlockByHeight($height: bigint!) {
  block_metadata_transactions(where: {block_height: {_eq: $height}}) {
    version
    block_height
    epoch
    round
    proposer
    timestamp
    failed_proposer_indices
  }
}
```

### Transactions in Block
```graphql
query BlockTransactions($height: bigint!) {
  user_transactions(
    where: {block_height: {_eq: $height}}
    order_by: {version: asc}
  ) {
    version
    sender
    timestamp
    gas_unit_price
    max_gas_amount
    entry_function_id_str
  }
}
```

### Account Modules (via RPC)
```
GET /accounts/{address}/modules
```
Returns list of modules with ABI.

### Ledger Info (for chain state)
```graphql
query LedgerInfo {
  ledger_infos {
    chain_id
    epoch
    ledger_version
    block_height
  }
}
```

---

## RPC Fallback Endpoints

| Purpose | Endpoint |
|---------|----------|
| Transaction by hash | `GET /transactions/by_hash/{hash}` |
| Transaction by version | `GET /transactions/by_version/{version}` |
| Account info | `GET /accounts/{address}` |
| Account modules | `GET /accounts/{address}/modules` |
| Account resources | `GET /accounts/{address}/resources` |
| Block by height | `GET /blocks/by_height/{height}` |
| Simulate tx | `POST /transactions/simulate` |
| Submit tx | `POST /transactions` |

---

## File Structure (Proposed)

```
app/
  page.tsx              # Homepage
  layout.tsx            # Root layout + providers
  globals.css           # Tailwind + theme
components/
  search-bar.tsx
  transaction-list.tsx
  transaction-row.tsx
  address-display.tsx
  pagination.tsx
  tabs.tsx
  nft-grid.tsx
  module-runner.tsx
  wallet-connect.tsx
  theme-toggle.tsx
lib/
  queries/              # GraphQL query functions
    transactions.ts
    accounts.ts
    blocks.ts
    tokens.ts
    nfts.ts
  rpc/                  # RPC fallback functions
    client.ts
    modules.ts
  utils.ts
  format.ts             # Address truncation, time formatting
  types.ts              # TypeScript types
hooks/
  use-transaction.ts
  use-account.ts
  use-block.ts
providers/
  query-provider.tsx    # TanStack Query
  wallet-provider.tsx   # Aptos Wallet Adapter
  theme-provider.tsx
```

---

## Resolved Decisions

- **Wallets**: Nightly and Razor via Aptos Wallet Adapter
- **NFT images**: Direct load from source URI, placeholder on fail

## Remaining Questions (to verify during implementation)

1. **MOVE decimals**: Verify decimal precision (likely 8 like APT)
2. **Module ABI format**: Verify exact RPC response structure
3. **Rate limits**: Implement exponential backoff for indexer 429s
4. **NFT metadata**: Test if `current_token_datas_v2` table exists for fetching token metadata

---

## Implementation Plan

### Phase 1: Foundation
1. Install dependencies: `@tanstack/react-query`, `@aptos-labs/wallet-adapter-react`, `graphql-request`
2. Set up providers (Query, Wallet, Theme)
3. Create `lib/queries/` GraphQL client + query functions
4. Create `lib/format.ts` (address truncation, relative time, MOVE formatting)

### Phase 2: Core Pages
1. Homepage with transaction list + pagination
2. Search bar with auto-detect logic
3. Transaction detail page
4. Account detail page with tabs
5. Block detail page

### Phase 3: Tokens & NFTs
1. Token balance tab on account page
2. NFT grid tab with lazy loading
3. Token metadata tooltips

### Phase 4: Modules & Wallet
1. Modules tab with ABI display
2. Run function UI with smart input parsing
3. Wallet connection (Nightly, Razor)
4. Transaction execution + toast notifications

### Phase 5: Polish
1. Dark/light theme toggle
2. Mobile responsive refinements
3. Error handling + RPC fallback
4. Loading states and skeletons
