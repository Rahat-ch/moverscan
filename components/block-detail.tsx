'use client'

import { useQuery } from '@tanstack/react-query'
import { getBlockByHeight, getBlockTransactions } from '@/lib/graphql/queries'
import { truncateAddress, formatRelativeTime, formatGas, parseEntryFunction } from '@/lib/format'
import Link from 'next/link'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'

interface BlockDetailProps {
  height: number
}

export function BlockDetail({ height }: BlockDetailProps) {
  const [copied, setCopied] = useState(false)

  const { data: block, isLoading: loadingBlock, error: blockError } = useQuery({
    queryKey: ['block', height],
    queryFn: () => getBlockByHeight(height),
  })

  const { data: transactions, isLoading: loadingTxs } = useQuery({
    queryKey: ['block-transactions', height],
    queryFn: () => getBlockTransactions(height),
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loadingBlock) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-48 bg-muted rounded" />
      </div>
    )
  }

  if (blockError || !block) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-2">Block not found</p>
        <p className="text-muted-foreground text-sm">Block {height} does not exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Block #{height.toLocaleString()}</h1>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Back to transactions
        </Link>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            <Row label="Block Height">
              <span className="font-mono">{block.block_height.toLocaleString()}</span>
              <button
                onClick={() => copyToClipboard(block.block_height.toString())}
                className="ml-2 p-1 hover:bg-muted rounded"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </Row>

            <Row label="Timestamp">
              {formatRelativeTime(block.timestamp)}
              <span className="text-muted-foreground ml-2">
                ({new Date(block.timestamp + 'Z').toLocaleString()})
              </span>
            </Row>

            <Row label="Epoch">
              {block.epoch.toLocaleString()}
            </Row>

            <Row label="Round">
              {block.round.toLocaleString()}
            </Row>

            <Row label="Proposer">
              <Link href={`/?address=${block.proposer}`} className="text-primary hover:underline font-mono">
                {block.proposer}
              </Link>
            </Row>

            <Row label="Version">
              <Link href={`/?tx=${block.version}`} className="text-primary hover:underline font-mono">
                {block.version.toLocaleString()}
              </Link>
            </Row>
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">
          Transactions in Block ({transactions?.length || 0})
        </h2>

        {loadingTxs ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        ) : !transactions || transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-border rounded-lg">
            No user transactions in this block.
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">Version</th>
                  <th className="text-left py-3 px-4 font-medium">From</th>
                  <th className="text-left py-3 px-4 font-medium hidden md:table-cell">Method</th>
                  <th className="text-right py-3 px-4 font-medium hidden lg:table-cell">Gas</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const parsed = parseEntryFunction(tx.entry_function_id_str)
                  return (
                    <tr key={tx.version} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4">
                        <Link href={`/?tx=${tx.version}`} className="text-primary hover:underline font-mono">
                          {tx.version}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/?address=${tx.sender}`}
                          className="text-primary hover:underline font-mono"
                          title={tx.sender}
                        >
                          {truncateAddress(tx.sender)}
                        </Link>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        {parsed ? (
                          <span className="inline-block px-2 py-1 bg-muted rounded text-xs font-mono truncate max-w-[200px]">
                            {parsed.function}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right hidden lg:table-cell font-mono text-xs">
                        {formatGas(tx.max_gas_amount, tx.gas_unit_price)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td className="py-4 px-4 text-muted-foreground w-48 align-top">{label}</td>
      <td className="py-4 px-4">{children}</td>
    </tr>
  )
}
