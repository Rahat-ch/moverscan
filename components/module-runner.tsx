'use client'

import { useState } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { viewFunction, type ExposedFunction } from '@/lib/rpc/client'
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface ModuleRunnerProps {
  address: string
  moduleName: string
  func: ExposedFunction
}

export function ModuleRunner({ address, moduleName, func }: ModuleRunnerProps) {
  const { signAndSubmitTransaction, connected } = useWallet()
  const [args, setArgs] = useState<string[]>(func.params.map(() => ''))
  const [typeArgs, setTypeArgs] = useState<string[]>(func.generic_type_params.map(() => ''))
  const [result, setResult] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [txHash, setTxHash] = useState<string | null>(null)

  const filteredParams = func.params.filter(p => p !== '&signer' && p !== 'signer')

  const handleRun = async () => {
    setLoading(true)
    setResult(null)
    setError(null)
    setTxHash(null)

    try {
      if (func.is_view) {
        const response = await viewFunction({
          function: `${address}::${moduleName}::${func.name}`,
          type_arguments: typeArgs.filter(Boolean),
          arguments: args.slice(0, filteredParams.length).filter(Boolean),
        })
        setResult(response)
      } else if (func.is_entry) {
        if (!connected) {
          setError('Please connect your wallet to execute entry functions')
          return
        }

        const payload = {
          function: `${address}::${moduleName}::${func.name}`,
          typeArguments: typeArgs.filter(Boolean),
          functionArguments: args.slice(0, filteredParams.length).map(parseArg),
        }

        const response = await signAndSubmitTransaction({ data: payload })
        setTxHash(response.hash)
        setResult({ success: true, hash: response.hash })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  const parseArg = (arg: string): unknown => {
    try {
      if (arg.startsWith('[') || arg.startsWith('{')) {
        return JSON.parse(arg)
      }
      if (arg === 'true') return true
      if (arg === 'false') return false
      if (/^\d+$/.test(arg)) return arg
      return arg
    } catch {
      return arg
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div>
        <h3 className="font-mono font-medium text-lg">
          {moduleName}::{func.name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
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
      </div>

      {func.generic_type_params.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Type Arguments</label>
          {func.generic_type_params.map((_, i) => (
            <input
              key={i}
              type="text"
              value={typeArgs[i] || ''}
              onChange={(e) => {
                const newTypeArgs = [...typeArgs]
                newTypeArgs[i] = e.target.value
                setTypeArgs(newTypeArgs)
              }}
              placeholder={`Type argument ${i + 1} (e.g., 0x1::aptos_coin::AptosCoin)`}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono"
            />
          ))}
        </div>
      )}

      {filteredParams.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Arguments</label>
          {filteredParams.map((param, i) => (
            <div key={i}>
              <label className="text-xs text-muted-foreground font-mono">{param}</label>
              <input
                type="text"
                value={args[i] || ''}
                onChange={(e) => {
                  const newArgs = [...args]
                  newArgs[i] = e.target.value
                  setArgs(newArgs)
                }}
                placeholder={getPlaceholder(param)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm font-mono"
              />
            </div>
          ))}
        </div>
      )}

      {func.is_entry && !connected && (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          Connect wallet to execute entry functions
        </div>
      )}

      <button
        onClick={handleRun}
        disabled={loading || (func.is_entry && !connected)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {func.is_view ? 'Querying...' : 'Submitting...'}
          </>
        ) : (
          func.is_view ? 'Query' : 'Execute'
        )}
      </button>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
          <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <pre className="whitespace-pre-wrap break-all">{error}</pre>
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Success</span>
          </div>
          {txHash && (
            <div className="text-sm">
              Transaction:{' '}
              <Link href={`/?tx=${txHash}`} className="text-primary hover:underline font-mono">
                {txHash.slice(0, 16)}...
              </Link>
            </div>
          )}
          <pre className="p-3 bg-muted rounded-lg text-xs font-mono overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

function getPlaceholder(paramType: string): string {
  if (paramType.includes('address')) return '0x...'
  if (paramType.includes('u64') || paramType.includes('u128')) return '0'
  if (paramType.includes('bool')) return 'true or false'
  if (paramType.includes('vector')) return '[value1, value2]'
  if (paramType.includes('string') || paramType.includes('String')) return 'text'
  return 'value'
}
