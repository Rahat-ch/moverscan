import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'
import { WalletConnect } from './wallet-connect'

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          Moverscan
        </Link>
        <nav className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">Movement Network</span>
          <ThemeToggle />
          <WalletConnect />
        </nav>
      </div>
    </header>
  )
}
