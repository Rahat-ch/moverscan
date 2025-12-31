# Draft Spec

We are building a clone of Etherscan (https://etherscan.io/) but we're going to rebuild it and make it work for Movement. 

Movement is a move based blockchain built on the Aptos Framework. Most things that work on Aptos should work exactly the same on Movement. 

RPC:
https://mainnet.movementnetwork.xyz/v1

Indexer Endpoint: 
https://indexer.mainnet.movementnetwork.xyz/v1/graphql

We want to build out a version of etherscan that has the following: 

Main page with latest transactions
Search bar that can search for transactions, accounts, blocks etc

We want to default to the Indexer since this is read heavy - use RPC only as a backup as needed 

We need a fully fleshed out plan with all of the indexer queries documented before proceeding 

