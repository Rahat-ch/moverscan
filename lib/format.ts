const MOVE_DECIMALS = 8

export function truncateAddress(address: string, start = 6, end = 4): string {
  if (!address) return ''
  if (address.length <= start + end + 3) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

export function formatRelativeTime(timestamp: string): string {
  const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z'
  const date = new Date(utcTimestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return `${seconds}s ago`
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`

  return date.toLocaleDateString()
}

export function formatMOVE(amount: number | string, decimals = MOVE_DECIMALS): string {
  const value = typeof amount === 'string' ? BigInt(amount) : BigInt(amount)
  const divisor = BigInt(10 ** decimals)
  const intPart = value / divisor
  const fracPart = value % divisor

  const fracStr = fracPart.toString().padStart(decimals, '0').slice(0, 4)
  const trimmedFrac = fracStr.replace(/0+$/, '')

  if (trimmedFrac) {
    return `${intPart.toLocaleString()}.${trimmedFrac} MOVE`
  }
  return `${intPart.toLocaleString()} MOVE`
}

export function formatGas(gasUsed: number, gasUnitPrice: number): string {
  const totalGas = BigInt(gasUsed) * BigInt(gasUnitPrice)
  return formatMOVE(totalGas.toString())
}

export function parseEntryFunction(entryFunctionIdStr: string | null): { module: string; function: string } | null {
  if (!entryFunctionIdStr) return null
  const parts = entryFunctionIdStr.split('::')
  if (parts.length < 3) return null
  return {
    module: `${parts[0]}::${parts[1]}`,
    function: parts[2],
  }
}

export function isValidAddress(input: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(input)
}

export function isNumeric(input: string): boolean {
  return /^\d+$/.test(input)
}

export function detectSearchType(input: string): 'address' | 'version' | 'block' | 'invalid' {
  const trimmed = input.trim()
  if (isValidAddress(trimmed)) return 'address'
  if (isNumeric(trimmed)) {
    const num = parseInt(trimmed, 10)
    if (num > 1000000) return 'version'
    return 'block'
  }
  return 'invalid'
}
