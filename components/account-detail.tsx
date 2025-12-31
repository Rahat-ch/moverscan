'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import {
  getAccountTransactions,
  getAccountTokenBalances,
  getAccountNFTs,
  getTransactionByVersion,
  getTokenMetadata,
  getNFTTokenData,
  type UserTransaction,
  type FungibleAssetBalance,
  type TokenOwnership,
} from '@/lib/graphql/queries'
import { getAccountModules, type ModuleABI, type ExposedFunction } from '@/lib/rpc/client'
import { truncateAddress, formatRelativeTime, formatGas, parseEntryFunction } from '@/lib/format'
import { Copy, Check, ChevronDown, ChevronUp, Play } from 'lucide-react'
import { ModuleRunner } from './module-runner'

interface AccountDetailProps {
  address: string
}

type Tab = 'transactions' | 'tokens' | 'nfts' | 'modules'

export function AccountDetail({ address }: AccountDetailProps) {
  const [activeTab, setActiveTab] = useState<Tab>('transactions')
  const [copied, setCopied] = useState(false)

  const { data: modules } = useQuery({
    queryKey: ['account-modules', address],
    queryFn: () => getAccountModules(address),
  })

  const copyToClipboard = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasModules = modules && modules.length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Account</h1>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Back to transactions
        </Link>
      </div>

      <div className="border border-border rounded-lg p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground text-sm">Address:</span>
          <span className="font-mono text-sm break-all">{address}</span>
          <button onClick={copyToClipboard} className="p-1 hover:bg-muted rounded">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="border-b border-border">
        <nav className="flex gap-4 overflow-x-auto">
          {(['transactions', 'tokens', 'nfts', ...(hasModules ? ['modules'] : [])] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 text-sm font-medium capitalize whitespace-nowrap ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {tab === 'modules' && modules && ` (${modules.length})`}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'transactions' && <TransactionsTab address={address} />}
      {activeTab === 'tokens' && <TokensTab address={address} />}
      {activeTab === 'nfts' && <NFTsTab address={address} />}
      {activeTab === 'modules' && hasModules && <ModulesTab address={address} modules={modules} />}
    </div>
  )
}

function TransactionsTab({ address }: { address: string }) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 25

  const { data: accountTxs, isLoading: loadingAccTxs } = useQuery({
    queryKey: ['account-transactions', address, page],
    queryFn: () => getAccountTransactions(address, PAGE_SIZE, page * PAGE_SIZE),
  })

  const versions = accountTxs?.map((tx) => tx.transaction_version) || []

  const { data: transactions, isLoading: loadingTxs } = useQuery({
    queryKey: ['transactions-by-versions', versions],
    queryFn: async () => {
      const txs = await Promise.all(versions.map((v) => getTransactionByVersion(v)))
      return txs.filter((tx): tx is UserTransaction => tx !== null)
    },
    enabled: versions.length > 0,
  })

  const isLoading = loadingAccTxs || loadingTxs

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded" />
        ))}
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No transactions found for this account.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground">
            <th className="text-left py-3 px-2 font-medium">Version</th>
            <th className="text-left py-3 px-2 font-medium hidden md:table-cell">Method</th>
            <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Block</th>
            <th className="text-right py-3 px-2 font-medium">Age</th>
            <th className="text-right py-3 px-2 font-medium hidden lg:table-cell">Gas</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const parsed = parseEntryFunction(tx.entry_function_id_str)
            return (
              <tr key={tx.version} className="border-b border-border hover:bg-muted/50">
                <td className="py-3 px-2">
                  <Link href={`/?tx=${tx.version}`} className="text-primary hover:underline font-mono">
                    {tx.version}
                  </Link>
                </td>
                <td className="py-3 px-2 hidden md:table-cell">
                  {parsed ? (
                    <span className="inline-block px-2 py-1 bg-muted rounded text-xs font-mono truncate max-w-[200px]">
                      {parsed.function}
                    </span>
                  ) : '-'}
                </td>
                <td className="py-3 px-2 hidden sm:table-cell">
                  <Link href={`/?block=${tx.block_height}`} className="text-primary hover:underline">
                    {tx.block_height.toLocaleString()}
                  </Link>
                </td>
                <td className="py-3 px-2 text-right text-muted-foreground">
                  {formatRelativeTime(tx.timestamp)}
                </td>
                <td className="py-3 px-2 text-right hidden lg:table-cell font-mono text-xs">
                  {formatGas(tx.max_gas_amount, tx.gas_unit_price)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
          className="px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-muted-foreground">Page {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!accountTxs || accountTxs.length < PAGE_SIZE}
          className="px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function TokensTab({ address }: { address: string }) {
  const { data: tokens, isLoading } = useQuery({
    queryKey: ['account-tokens', address],
    queryFn: () => getAccountTokenBalances(address),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded" />
        ))}
      </div>
    )
  }

  if (!tokens || tokens.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No token balances found for this account.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tokens.map((token) => (
        <TokenCard key={token.asset_type} token={token} />
      ))}
    </div>
  )
}

function TokenCard({ token }: { token: FungibleAssetBalance }) {
  const { data: metadata } = useQuery({
    queryKey: ['token-metadata', token.asset_type],
    queryFn: () => getTokenMetadata(token.asset_type),
  })

  const name = metadata?.name || token.asset_type.split('::').pop() || 'Unknown'
  const symbol = metadata?.symbol || ''
  const decimals = metadata?.decimals || 8

  const formatAmount = (amount: string, dec: number) => {
    const value = BigInt(amount)
    const divisor = BigInt(10 ** dec)
    const intPart = value / divisor
    const fracPart = value % divisor
    const fracStr = fracPart.toString().padStart(dec, '0').slice(0, 4).replace(/0+$/, '')
    return fracStr ? `${intPart.toLocaleString()}.${fracStr}` : intPart.toLocaleString()
  }

  return (
    <div className="border border-border rounded-lg p-4 hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {metadata?.icon_uri ? (
            <img src={metadata.icon_uri} alt={name} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
              {name.charAt(0)}
            </div>
          )}
          <div>
            <p className="font-medium">{name}</p>
            <p className="text-xs text-muted-foreground font-mono truncate max-w-xs" title={token.asset_type}>
              {truncateAddress(token.asset_type, 16, 8)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono font-medium">
            {formatAmount(token.amount, decimals)} {symbol}
          </p>
        </div>
      </div>
    </div>
  )
}

function NFTsTab({ address }: { address: string }) {
  const { data: nfts, isLoading } = useQuery({
    queryKey: ['account-nfts', address],
    queryFn: () => getAccountNFTs(address),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  if (!nfts || nfts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No NFTs found for this account.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {nfts.map((nft) => (
        <NFTCard key={nft.token_data_id} nft={nft} />
      ))}
    </div>
  )
}

function NFTCard({ nft }: { nft: TokenOwnership }) {
  const { data: tokenData } = useQuery({
    queryKey: ['nft-data', nft.token_data_id],
    queryFn: () => getNFTTokenData(nft.token_data_id),
  })

  const [imgError, setImgError] = useState(false)
  const imageUrl = tokenData?.token_uri || null

  return (
    <div className="border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-muted flex items-center justify-center">
        {imageUrl && !imgError ? (
          <img
            src={imageUrl}
            alt={tokenData?.token_name || 'NFT'}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-4xl">🖼️</span>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium truncate" title={tokenData?.token_name}>
          {tokenData?.token_name || truncateAddress(nft.token_data_id, 8, 6)}
        </p>
        <p className="text-xs text-muted-foreground">Amount: {nft.amount}</p>
      </div>
    </div>
  )
}

function ModulesTab({ address, modules }: { address: string; modules: ModuleABI[] }) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null)
  const [selectedFunction, setSelectedFunction] = useState<{ module: string; func: ExposedFunction } | null>(null)

  return (
    <div className="space-y-4">
      {selectedFunction ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedFunction(null)}
            className="text-sm text-primary hover:underline"
          >
            ← Back to modules
          </button>
          <ModuleRunner
            address={address}
            moduleName={selectedFunction.module}
            func={selectedFunction.func}
          />
        </div>
      ) : (
        modules.map((module) => (
          <div key={module.name} className="border border-border rounded-lg">
            <button
              onClick={() => setExpandedModule(expandedModule === module.name ? null : module.name)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono font-medium">{module.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({module.exposed_functions.length} functions)
                </span>
              </div>
              {expandedModule === module.name ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </button>

            {expandedModule === module.name && (
              <div className="border-t border-border p-4 space-y-3">
                {module.exposed_functions.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No exposed functions</p>
                ) : (
                  module.exposed_functions.map((func) => (
                    <div
                      key={func.name}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{func.name}</span>
                          {func.is_view && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                              view
                            </span>
                          )}
                          {func.is_entry && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
                              entry
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          ({func.params.join(', ')}) → [{func.return.join(', ')}]
                        </p>
                      </div>
                      {(func.is_view || func.is_entry) && (
                        <button
                          onClick={() => setSelectedFunction({ module: module.name, func })}
                          className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
                        >
                          <Play className="w-4 h-4" />
                          Run
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
