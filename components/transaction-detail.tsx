'use client'

import { useQuery } from '@tanstack/react-query'
import { getTransactionByVersion, getTransactionEvents } from '@/lib/graphql/queries'
import { truncateAddress, formatRelativeTime, formatGas, parseEntryFunction } from '@/lib/format'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

interface TransactionDetailProps {
  version: number
}

export function TransactionDetail({ version }: TransactionDetailProps) {
  const [showEvents, setShowEvents] = useState(false)
  const [copied, setCopied] = useState(false)

  const { data: tx, isLoading, error } = useQuery({
    queryKey: ['transaction', version],
    queryFn: () => getTransactionByVersion(version),
  })

  const { data: events } = useQuery({
    queryKey: ['transaction-events', version],
    queryFn: () => getTransactionEvents(version),
    enabled: showEvents,
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3" />
        <div className="h-64 bg-muted rounded" />
      </div>
    )
  }

  if (error || !tx) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-2">Transaction not found</p>
        <p className="text-muted-foreground text-sm">Version {version} does not exist or is not a user transaction.</p>
      </div>
    )
  }

  const parsed = parseEntryFunction(tx.entry_function_id_str)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Transaction Details</h1>
        <Link href="/" className="text-sm text-primary hover:underline">
          ← Back to transactions
        </Link>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            <Row label="Transaction Version">
              <span className="font-mono">{tx.version}</span>
              <button
                onClick={() => copyToClipboard(tx.version.toString())}
                className="ml-2 p-1 hover:bg-muted rounded"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </Row>

            <Row label="Status">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Success
              </span>
            </Row>

            <Row label="Block">
              <Link href={`/?block=${tx.block_height}`} className="text-primary hover:underline">
                {tx.block_height.toLocaleString()}
              </Link>
            </Row>

            <Row label="Timestamp">
              {formatRelativeTime(tx.timestamp)}
              <span className="text-muted-foreground ml-2">
                ({new Date(tx.timestamp + 'Z').toLocaleString()})
              </span>
            </Row>

            <Row label="From">
              <Link href={`/?address=${tx.sender}`} className="text-primary hover:underline font-mono">
                {tx.sender}
              </Link>
            </Row>

            <Row label="Epoch">
              {tx.epoch}
            </Row>

            <Row label="Sequence Number">
              {tx.sequence_number}
            </Row>

            {parsed && (
              <Row label="Method">
                <div className="space-y-1">
                  <span className="inline-block px-2 py-1 bg-muted rounded font-mono text-xs">
                    {parsed.function}
                  </span>
                  <p className="text-muted-foreground text-xs">
                    Module: {parsed.module}
                  </p>
                </div>
              </Row>
            )}

            <Row label="Gas">
              <div className="space-y-1">
                <p>Max: {tx.max_gas_amount.toLocaleString()} units</p>
                <p>Price: {formatGas(1, tx.gas_unit_price)}/unit</p>
                <p className="font-medium">Max Cost: {formatGas(tx.max_gas_amount, tx.gas_unit_price)}</p>
              </div>
            </Row>
          </tbody>
        </table>
      </div>

      <div className="border border-border rounded-lg">
        <button
          onClick={() => setShowEvents(!showEvents)}
          className="w-full flex items-center justify-between p-4 hover:bg-muted/50"
        >
          <span className="font-medium">Events</span>
          {showEvents ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>

        {showEvents && (
          <div className="border-t border-border p-4">
            {events && events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event, i) => (
                  <div key={i} className="border border-border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Event #{event.event_index}</span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded truncate max-w-xs">
                        {event.type}
                      </span>
                    </div>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(typeof event.data === 'string' ? JSON.parse(event.data) : event.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No events found</p>
            )}
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
