import { http, createConfig } from 'wagmi'
import { mainnet, polygon, arbitrum, optimism, bsc } from 'wagmi/chains'

export const config = createConfig({
  chains: [mainnet, polygon, arbitrum, optimism, bsc],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http(),
  },
  connectors: [
    // Add wallet connectors here
  ],
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}