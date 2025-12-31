import { Header } from '@/components/header'
import { SearchBar } from '@/components/search-bar'
import { TransactionList } from '@/components/transaction-list'
import { TransactionDetail } from '@/components/transaction-detail'
import { AccountDetail } from '@/components/account-detail'
import { BlockDetail } from '@/components/block-detail'

interface Props {
  searchParams: Promise<{ tx?: string; address?: string; block?: string }>
}

export default async function Home({ searchParams }: Props) {
  const params = await searchParams
  const txVersion = params.tx ? parseInt(params.tx, 10) : null
  const address = params.address || null
  const blockHeight = params.block ? parseInt(params.block, 10) : null

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-8 mb-12">
          <h1 className="text-3xl font-bold text-center">
            Movement Blockchain Explorer
          </h1>
          <SearchBar />
        </div>

        {txVersion ? (
          <TransactionDetail version={txVersion} />
        ) : address ? (
          <AccountDetail address={address} />
        ) : blockHeight ? (
          <BlockDetail height={blockHeight} />
        ) : (
          <section>
            <h2 className="text-xl font-semibold mb-4">Latest Transactions</h2>
            <TransactionList />
          </section>
        )}
      </main>
    </div>
  )
}
