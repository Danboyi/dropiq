import { db } from '@/lib/db'

const sampleAirdrops = [
  {
    name: "LayerZero",
    slug: "layerzero",
    description: "Omnichain interoperability protocol enabling seamless cross-chain communication and asset transfers.",
    category: "layer2",
    logoUrl: "https://picsum.photos/seed/layerzero/100/100.jpg",
    websiteUrl: "https://layerzero.network",
    twitterUrl: "https://twitter.com/LayerZero_Labs",
    discordUrl: "https://discord.gg/layerzero",
    telegramUrl: null,
    riskScore: 25,
    hypeScore: 85,
    status: "approved",
    requirements: JSON.stringify([
      {
        id: "req-1",
        title: "Bridge assets using LayerZero",
        description: "Bridge at least $10 worth of assets across different chains using LayerZero bridges",
        type: "transaction",
        link: "https://layerzero.network/bridges"
      },
      {
        id: "req-2",
        title: "Follow on Twitter",
        description: "Follow LayerZero Labs on Twitter and engage with their posts",
        type: "social",
        link: "https://twitter.com/LayerZero_Labs"
      },
      {
        id: "req-3",
        title: "Join Discord",
        description: "Join the official LayerZero Discord server and verify your account",
        type: "social",
        link: "https://discord.gg/layerzero"
      }
    ]),
    notes: "High potential airdrop from major interoperability protocol. Low risk due to established team and partnerships."
  },
  {
    name: "zkSync Era",
    slug: "zksync-era",
    description: "Layer-2 scaling solution for Ethereum using zero-knowledge rollups to provide fast, cheap transactions.",
    category: "layer2",
    logoUrl: "https://picsum.photos/seed/zksync/100/100.jpg",
    websiteUrl: "https://zksync.io",
    twitterUrl: "https://twitter.com/zksync",
    discordUrl: "https://discord.gg/zksync",
    telegramUrl: null,
    riskScore: 20,
    hypeScore: 90,
    status: "approved",
    requirements: JSON.stringify([
      {
        id: "req-1",
        title: "Deploy a contract",
        description: "Deploy a smart contract on zkSync Era mainnet",
        type: "transaction",
        link: "https://portal.zksync.io/"
      },
      {
        id: "req-2",
        title: "Bridge funds",
        description: "Bridge funds from Ethereum to zkSync Era using the official bridge",
        type: "transaction",
        link: "https://bridge.zksync.io/"
      },
      {
        id: "req-3",
        title: "Use DeFi protocols",
        description: "Interact with at least 3 different DeFi protocols on zkSync",
        type: "transaction",
        link: "https://ecosystem.zksync.io/"
      }
    ]),
    notes: "Very high potential airdrop. Matter Labs is well-funded and the protocol has significant TVL."
  },
  {
    name: "Arbitrum One",
    slug: "arbitrum-one",
    description: "Leading Ethereum Layer-2 scaling solution using optimistic rollups for fast and cheap transactions.",
    category: "layer2",
    logoUrl: "https://picsum.photos/seed/arbitrum/100/100.jpg",
    websiteUrl: "https://arbitrum.io",
    twitterUrl: "https://twitter.com/arbitrum",
    discordUrl: "https://discord.gg/arbitrum",
    telegramUrl: null,
    riskScore: 15,
    hypeScore: 95,
    status: "approved",
    requirements: JSON.stringify([
      {
        id: "req-1",
        title: "Use Arbitrum Bridge",
        description: "Bridge assets from Ethereum to Arbitrum One",
        type: "transaction",
        link: "https://bridge.arbitrum.io/"
      },
      {
        id: "req-2",
        title: "Stake ARB",
        description: "Stake ARB tokens in the governance protocol",
        type: "holding",
        link: "https://arbitrum.io/governance"
      },
      {
        id: "req-3",
        title: "Vote on proposals",
        description: "Participate in Arbitrum governance by voting on proposals",
        type: "social",
        link: "https://arbitrum.io/governance"
      }
    ]),
    notes: "Arbitrum has already had their token airdrop, but future governance rewards are possible."
  },
  {
    name: "Uniswap",
    slug: "uniswap",
    description: "Leading decentralized exchange protocol on Ethereum providing automated market maker functionality.",
    category: "defi",
    logoUrl: "https://picsum.photos/seed/uniswap/100/100.jpg",
    websiteUrl: "https://uniswap.org",
    twitterUrl: "https://twitter.com/Uniswap",
    discordUrl: null,
    telegramUrl: null,
    riskScore: 10,
    hypeScore: 70,
    status: "approved",
    requirements: JSON.stringify([
      {
        id: "req-1",
        title: "Provide liquidity",
        description: "Provide liquidity to any Uniswap V3 pool",
        type: "transaction",
        link: "https://app.uniswap.org/pools"
      },
      {
        id: "req-2",
        title: "Make swaps",
        description: "Perform at least 5 swaps on Uniswap",
        type: "transaction",
        link: "https://app.uniswap.org/swap"
      },
      {
        id: "req-3",
        title: "Vote on governance",
        description: "Participate in Uniswap governance",
        type: "social",
        link: "https://gov.uniswap.org/"
      }
    ]),
    notes: "Uniswap has already distributed their airdrop, but continued participation may lead to future rewards."
  },
  {
    name: "Axie Infinity",
    slug: "axie-infinity",
    description: "Blockchain-based trading and battling game where players can collect, breed, and battle creatures called Axies.",
    category: "gaming",
    logoUrl: "https://picsum.photos/seed/axie/100/100.jpg",
    websiteUrl: "https://axieinfinity.com",
    twitterUrl: "https://twitter.com/AxieInfinity",
    discordUrl: "https://discord.gg/axie",
    telegramUrl: null,
    riskScore: 65,
    hypeScore: 60,
    status: "approved",
    requirements: JSON.stringify([
      {
        id: "req-1",
        title: "Play the game",
        description: "Play at least 10 Arena matches",
        type: "gaming",
        link: "https://app.axieinfinity.com/"
      },
      {
        id: "req-2",
        title: "Own Axies",
        description: "Own at least 3 Axies in your wallet",
        type: "holding",
        link: "https://marketplace.axieinfinity.com/"
      },
      {
        id: "req-3",
        title: "Stake AXS",
        description: "Stake AXS tokens in the governance system",
        type: "holding",
        link: "https://staking.axieinfinity.com/"
      }
    ]),
    notes: "Higher risk due to gaming volatility, but strong community and established platform."
  }
]

export async function seedAirdrops() {
  try {
    console.log('Seeding sample airdrops...')
    
    for (const airdrop of sampleAirdrops) {
      await db.airdrop.upsert({
        where: { slug: airdrop.slug },
        update: airdrop,
        create: airdrop
      })
    }
    
    console.log('Sample airdrops seeded successfully!')
  } catch (error) {
    console.error('Error seeding airdrops:', error)
  }
}

// Run if called directly
if (require.main === module) {
  seedAirdrops()
}