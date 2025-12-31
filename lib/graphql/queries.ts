import { gql } from 'graphql-request'
import { graphqlClient } from './client'

export interface UserTransaction {
  version: number
  sender: string
  gas_unit_price: number
  max_gas_amount: number
  timestamp: string
  block_height: number
  entry_function_id_str: string | null
  epoch: number
  sequence_number: number
}

export interface AccountTransaction {
  transaction_version: number
  account_address: string
}

export interface FungibleAssetBalance {
  owner_address: string
  asset_type: string
  amount: string
  last_transaction_version: number
}

export interface TokenOwnership {
  token_data_id: string
  amount: number
  last_transaction_version: number
  owner_address: string
}

export interface BlockMetadata {
  version: number
  block_height: number
  epoch: number
  round: number
  proposer: string
  timestamp: string
}

export async function getLatestTransactions(limit = 25, offset = 0): Promise<UserTransaction[]> {
  const query = gql`
    query LatestTransactions($limit: Int!, $offset: Int!) {
      user_transactions(
        limit: $limit
        offset: $offset
        order_by: {version: desc}
      ) {
        version
        sender
        gas_unit_price
        max_gas_amount
        timestamp
        block_height
        entry_function_id_str
        epoch
        sequence_number
      }
    }
  `
  const data = await graphqlClient.request<{ user_transactions: UserTransaction[] }>(query, { limit, offset })
  return data.user_transactions
}

export async function getTransactionByVersion(version: number): Promise<UserTransaction | null> {
  const query = gql`
    query TransactionByVersion($version: bigint!) {
      user_transactions(where: {version: {_eq: $version}}) {
        version
        sender
        gas_unit_price
        max_gas_amount
        timestamp
        block_height
        entry_function_id_str
        epoch
        sequence_number
      }
    }
  `
  const data = await graphqlClient.request<{ user_transactions: UserTransaction[] }>(query, { version })
  return data.user_transactions[0] || null
}

export async function getAccountTransactions(address: string, limit = 25, offset = 0): Promise<AccountTransaction[]> {
  const query = gql`
    query AccountTransactions($address: String!, $limit: Int!, $offset: Int!) {
      account_transactions(
        where: {account_address: {_eq: $address}}
        limit: $limit
        offset: $offset
        order_by: {transaction_version: desc}
      ) {
        transaction_version
        account_address
      }
    }
  `
  const data = await graphqlClient.request<{ account_transactions: AccountTransaction[] }>(query, { address, limit, offset })
  return data.account_transactions
}

export async function getAccountTokenBalances(address: string): Promise<FungibleAssetBalance[]> {
  const query = gql`
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
  `
  const data = await graphqlClient.request<{ current_fungible_asset_balances: FungibleAssetBalance[] }>(query, { address })
  return data.current_fungible_asset_balances
}

export async function getAccountNFTs(address: string, limit = 50): Promise<TokenOwnership[]> {
  const query = gql`
    query AccountNFTs($address: String!, $limit: Int!) {
      current_token_ownerships_v2(
        where: {
          owner_address: {_eq: $address}
          amount: {_gt: "0"}
        }
        limit: $limit
      ) {
        token_data_id
        amount
        last_transaction_version
        owner_address
      }
    }
  `
  const data = await graphqlClient.request<{ current_token_ownerships_v2: TokenOwnership[] }>(query, { address, limit })
  return data.current_token_ownerships_v2
}

export async function getBlockByHeight(height: number): Promise<BlockMetadata | null> {
  const query = gql`
    query BlockByHeight($height: bigint!) {
      block_metadata_transactions(where: {block_height: {_eq: $height}}) {
        version
        block_height
        epoch
        round
        proposer
        timestamp
      }
    }
  `
  const data = await graphqlClient.request<{ block_metadata_transactions: BlockMetadata[] }>(query, { height })
  return data.block_metadata_transactions[0] || null
}

export async function getBlockTransactions(height: number): Promise<UserTransaction[]> {
  const query = gql`
    query BlockTransactions($height: bigint!) {
      user_transactions(
        where: {block_height: {_eq: $height}}
        order_by: {version: asc}
      ) {
        version
        sender
        gas_unit_price
        max_gas_amount
        timestamp
        block_height
        entry_function_id_str
        epoch
        sequence_number
      }
    }
  `
  const data = await graphqlClient.request<{ user_transactions: UserTransaction[] }>(query, { height })
  return data.user_transactions
}

export interface TransactionEvent {
  transaction_version: number
  event_index: number
  account_address: string
  type: string
  data: unknown
  sequence_number: number
  creation_number: number
}

export async function getTransactionEvents(version: number): Promise<TransactionEvent[]> {
  const query = gql`
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
  `
  const data = await graphqlClient.request<{ events: TransactionEvent[] }>(query, { version })
  return data.events
}

export interface TokenMetadata {
  asset_type: string
  name: string
  symbol: string
  decimals: number
  icon_uri: string | null
}

export async function getTokenMetadata(assetType: string): Promise<TokenMetadata | null> {
  const query = gql`
    query TokenMetadata($assetType: String!) {
      fungible_asset_metadata(where: {asset_type: {_eq: $assetType}}) {
        asset_type
        name
        symbol
        decimals
        icon_uri
      }
    }
  `
  const data = await graphqlClient.request<{ fungible_asset_metadata: TokenMetadata[] }>(query, { assetType })
  return data.fungible_asset_metadata[0] || null
}

export interface NFTTokenData {
  token_data_id: string
  token_name: string
  token_uri: string
  description: string
  collection_id: string
}

export async function getNFTTokenData(tokenDataId: string): Promise<NFTTokenData | null> {
  const query = gql`
    query NFTTokenData($tokenDataId: String!) {
      current_token_datas_v2(where: {token_data_id: {_eq: $tokenDataId}}) {
        token_data_id
        token_name
        token_uri
        description
        collection_id
      }
    }
  `
  const data = await graphqlClient.request<{ current_token_datas_v2: NFTTokenData[] }>(query, { tokenDataId })
  return data.current_token_datas_v2[0] || null
}
