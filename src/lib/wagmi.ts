import { createConfig, http } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, base } from 'wagmi/chains'
import { injected, metaMask, walletConnect, coinbaseWallet } from 'wagmi/connectors'

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id'

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, base],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({ 
      projectId,
      metadata: {
        name: 'DROPIQ',
        description: 'Trusted Crypto Airdrop Platform',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://dropiq.io',
        icons: ['https://dropiq.io/icon.png']
      }
    }),
    coinbaseWallet({
      appName: 'DROPIQ',
      appLogoUrl: 'https://dropiq.io/icon.png'
    })
  ],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
})

// Helper function to get chain name
export function getChainName(chainId: number): string {
  switch (chainId) {
    case mainnet.id:
      return 'Ethereum'
    case polygon.id:
      return 'Polygon'
    case arbitrum.id:
      return 'Arbitrum'
    case optimism.id:
      return 'Optimism'
    case base.id:
      return 'Base'
    default:
      return 'Unknown Network'
  }
}

// Helper function to get chain explorer URL
export function getChainExplorer(chainId: number): string {
  switch (chainId) {
    case mainnet.id:
      return 'https://etherscan.io'
    case polygon.id:
      return 'https://polygonscan.com'
    case arbitrum.id:
      return 'https://arbiscan.io'
    case optimism.id:
      return 'https://optimistic.etherscan.io'
    case base.id:
      return 'https://basescan.org'
    default:
      return 'https://etherscan.io'
  }
}