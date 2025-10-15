import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'DropIQ - AI-Powered Airdrop Platform',
  description: 'Discover and participate in vetted cryptocurrency airdrops with AI-powered insights',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background">
            {/* Navigation */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <h1 className="text-xl font-bold">DropIQ</h1>
                  <nav className="hidden md:flex items-center gap-6">
                    <a href="/dashboard" className="text-sm font-medium hover:text-primary">
                      Dashboard
                    </a>
                    <a href="/airdrops" className="text-sm font-medium hover:text-primary">
                      Airdrops
                    </a>
                    <a href="/analytics" className="text-sm font-medium hover:text-primary">
                      Analytics
                    </a>
                  </nav>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowAuthModal(true)}>
                    Sign In
                  </Button>
                  <Button onClick={() => setShowWalletModal(true)}>
                    Connect Wallet
                  </Button>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}