'use client'

import { useQuery } from '@tanstack/react-query'
import { getLatestTransactions, type UserTransaction } from '@/lib/graphql/queries'
import { truncateAddress, formatRelativeTime, formatGas, parseEntryFunction } from '@/lib/format'
import Link from 'next/link'
import { useState } from 'react'

const PAGE_SIZE = 25

export function TransactionList() {
  const [page, setPage] = useState(0)

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => getLatestTransactions(PAGE_SIZE, page * PAGE_SIZE),
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Failed to load transactions. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left py-3 px-2 font-medium">Version</th>
              <th className="text-left py-3 px-2 font-medium">From</th>
              <th className="text-left py-3 px-2 font-medium hidden md:table-cell">Method</th>
              <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Block</th>
              <th className="text-right py-3 px-2 font-medium">Age</th>
              <th className="text-right py-3 px-2 font-medium hidden lg:table-cell">Gas</th>
            </tr>
          </thead>
          <tbody>
            {transactions?.map((tx) => (
              <TransactionRow key={tx.version} tx={tx} />
            ))}
          </tbody>
        </table>
      </div>

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
          disabled={!transactions || transactions.length < PAGE_SIZE}
          className="px-4 py-2 rounded-lg border border-input bg-background hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )
}

function TransactionRow({ tx }: { tx: UserTransaction }) {
  const parsed = parseEntryFunction(tx.entry_function_id_str)

  return (
    <tr className="border-b border-border hover:bg-muted/50 transition-colors">
      <td className="py-3 px-2">
        <Link
          href={`/?tx=${tx.version}`}
          className="text-primary hover:underline font-mono"
        >
          {tx.version}
        </Link>
      </td>
      <td className="py-3 px-2">
        <Link
          href={`/?address=${tx.sender}`}
          className="text-primary hover:underline font-mono"
          title={tx.sender}
        >
          {truncateAddress(tx.sender)}
        </Link>
      </td>
      <td className="py-3 px-2 hidden md:table-cell">
        {parsed ? (
          <span className="inline-block px-2 py-1 bg-muted rounded text-xs font-mono truncate max-w-[200px]">
            {parsed.function}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </td>
      <td className="py-3 px-2 hidden sm:table-cell">
        <Link
          href={`/?block=${tx.block_height}`}
          className="text-primary hover:underline"
        >
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
}
