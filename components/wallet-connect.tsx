'use client'

import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { truncateAddress } from '@/lib/format'
import { useState } from 'react'
import { Wallet, ChevronDown, LogOut, Copy, Check } from 'lucide-react'

export function WalletConnect() {
  const { connect, disconnect, account, connected, wallets } = useWallet()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showWallets, setShowWallets] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (connected && account) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-input bg-background hover:bg-accent text-sm"
        >
          <Wallet className="w-4 h-4" />
          <span className="font-mono">{truncateAddress(account.address.toString())}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
            <button
              onClick={copyAddress}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted text-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Copy Address
            </button>
            <button
              onClick={() => {
                disconnect()
                setShowDropdown(false)
              }}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted text-sm text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowWallets(!showWallets)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>

      {showWallets && (
        <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="p-2 border-b border-border">
            <p className="text-xs text-muted-foreground px-2">Select Wallet</p>
          </div>
          {wallets?.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => {
                connect(wallet.name)
                setShowWallets(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-sm"
            >
              {wallet.icon && (
                <img src={wallet.icon} alt={wallet.name} className="w-6 h-6 rounded" />
              )}
              <span>{wallet.name}</span>
            </button>
          ))}
          {(!wallets || wallets.length === 0) && (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              No wallets detected. Install Nightly or Razor wallet.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
