import { GraphQLClient } from 'graphql-request'

const INDEXER_URL = 'https://indexer.mainnet.movementnetwork.xyz/v1/graphql'

export const graphqlClient = new GraphQLClient(INDEXER_URL, {
  headers: {
    'Content-Type': 'application/json',
  },
})
