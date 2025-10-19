import { Metadata } from 'next'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import MarketplaceHome from '@/components/marketplace/MarketplaceHome'

export const metadata: Metadata = {
  title: 'Marketplace | Airdrop Platform',
  description: 'Submit and discover premium airdrop campaigns',
}

export default function MarketplacePage() {
  return (
    <DashboardLayout>
      <MarketplaceHome />
    </DashboardLayout>
  )
}