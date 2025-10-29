import { db } from '@/lib/db'
import { alchemy } from '@/lib/alchemy'

interface DetectUserActivityJob {
  userId: string
}

// Supported chains for activity detection
const SUPPORTED_CHAINS = [
  { chainId: 1, name: 'ethereum' },
  { chainId: 137, name: 'polygon' },
  { chainId: 56, name: 'bsc' },
  { chainId: 42161, name: 'arbitrum' },
  { chainId: 10, name: 'optimism' }
]

/**
 * Activity Detection Job Processor
 * 
 * This job detects when a user has started participating in an airdrop
 * by analyzing their recent transaction history and matching it against
 * airdrop requirements.
 */
export async function detectUserActivity(userId: string): Promise<void> {
  console.log(`Starting activity detection for user: ${userId}`)

  try {
    // Fetch user's 'interested' airdrops
    const interestedAirdrops = await db.userAirdropStatus.findMany({
      where: {
        userId,
        status: 'interested'
      },
      include: {
        airdrop: {
          include: {
            project: true
          }
        }
      }
    })

    if (interestedAirdrops.length === 0) {
      console.log(`No interested airdrops found for user: ${userId}`)
      return
    }

    // Fetch user's linked wallets
    const userWallets = await db.wallet.findMany({
      where: {
        userId
      }
    })

    if (userWallets.length === 0) {
      console.log(`No wallets found for user: ${userId}`)
      return
    }

    console.log(`Checking ${userWallets.length} wallets for ${interestedAirdrops.length} interested airdrops`)

    // Collect all contract addresses from airdrop requirements
    const contractAddresses = new Set<string>()
    const addressToAirdropMap = new Map<string, any[]>()

    interestedAirdrops.forEach(userAirdrop => {
      if (userAirdrop.airdrop.requirements) {
        try {
          const requirements = JSON.parse(userAirdrop.airdrop.requirements as string)
          
          requirements.forEach((req: any) => {
            if (req.type === 'contract_interaction' && req.contractAddress) {
              const address = req.contractAddress.toLowerCase()
              contractAddresses.add(address)
              
              if (!addressToAirdropMap.has(address)) {
                addressToAirdropMap.set(address, [])
              }
              addressToAirdropMap.get(address)!.push(userAirdrop)
            }
          })
        } catch (error) {
          console.error(`Error parsing requirements for airdrop ${userAirdrop.airdropId}:`, error)
        }
      }
    })

    if (contractAddresses.size === 0) {
      console.log(`No contract addresses found in airdrop requirements for user: ${userId}`)
      return
    }

    // Check recent transactions for each wallet
    const detectedActivities: Array<{
      userAirdropStatusId: string
      airdropId: string
      contractAddress: string
      transactionHash: string
      walletAddress: string
    }> = []

    for (const wallet of userWallets) {
      try {
        const recentTransactions = await getRecentTransactions(wallet.address, wallet.chain)
        
        for (const tx of recentTransactions) {
          const toAddress = tx.to?.toLowerCase()
          const fromAddress = tx.from?.toLowerCase()
          
          // Check if transaction matches any contract address
          if (toAddress && contractAddresses.has(toAddress)) {
            const matchingAirdrops = addressToAirdropMap.get(toAddress) || []
            
            for (const userAirdrop of matchingAirdrops) {
              detectedActivities.push({
                userAirdropStatusId: userAirdrop.id,
                airdropId: userAirdrop.airdropId,
                contractAddress: toAddress,
                transactionHash: tx.hash,
                walletAddress: wallet.address
              })
            }
          }
          
          // Also check from address in case of approval transactions
          if (fromAddress && contractAddresses.has(fromAddress)) {
            const matchingAirdrops = addressToAirdropMap.get(fromAddress) || []
            
            for (const userAirdrop of matchingAirdrops) {
              detectedActivities.push({
                userAirdropStatusId: userAirdrop.id,
                airdropId: userAirdrop.airdropId,
                contractAddress: fromAddress,
                transactionHash: tx.hash,
                walletAddress: wallet.address
              })
            }
          }
        }
      } catch (error) {
        console.error(`Error fetching transactions for wallet ${wallet.address}:`, error)
      }
    }

    // Update statuses and create security alerts
    if (detectedActivities.length > 0) {
      console.log(`Detected ${detectedActivities.length} activities for user: ${userId}`)
      
      for (const activity of detectedActivities) {
        // Update the user's airdrop status to 'in_progress'
        await db.userAirdropStatus.update({
          where: {
            id: activity.userAirdropStatusId
          },
          data: {
            status: 'in_progress',
            startedAt: new Date(),
            updatedAt: new Date()
          }
        })

        // Create a security alert
        await db.securityAlert.create({
          data: {
            userId,
            type: 'activity_detected',
            severity: 'info',
            title: 'Airdrop Activity Detected',
            message: `We detected activity on your wallet for the airdrop. Your status has been automatically updated to "In Progress".`,
            metadata: {
              airdropId: activity.airdropId,
              contractAddress: activity.contractAddress,
              transactionHash: activity.transactionHash,
              walletAddress: activity.walletAddress,
              detectedAt: new Date().toISOString()
            }
          }
        })

        console.log(`Updated status to in_progress for airdrop ${activity.airdropId} (user: ${userId})`)
      }
    } else {
      console.log(`No new activity detected for user: ${userId}`)
    }

  } catch (error) {
    console.error(`Activity detection failed for user ${userId}:`, error)
    throw error
  }
}

/**
 * Get recent transactions for a wallet address
 */
async function getRecentTransactions(address: string, chain: string): Promise<any[]> {
  try {
    // Calculate 72 hours ago
    const seventyTwoHoursAgo = Math.floor((Date.now() - 72 * 60 * 60 * 1000) / 1000)
    
    // Get the appropriate Alchemy instance for the chain
    const chainConfig = SUPPORTED_CHAINS.find(c => c.name === chain)
    if (!chainConfig) {
      console.warn(`Unsupported chain: ${chain}`)
      return []
    }

    const alchemyInstance = alchemy[chainConfig.chainId as keyof typeof alchemy]
    if (!alchemyInstance) {
      console.warn(`No Alchemy instance for chain: ${chain}`)
      return []
    }

    // Fetch transactions from the specified address
    const transfers = await alchemyInstance.core.getAssetTransfers({
      fromBlock: "0x0",
      fromAddress: address,
      category: ["external", "internal", "erc20", "erc721", "erc1155"],
      maxCount: 100,
      withMetadata: true
    })

    // Filter transactions from the last 72 hours
    const recentTransactions = transfers.transfers.filter((tx: any) => {
      if (tx.metadata && tx.metadata.blockTimestamp) {
        const blockTimestamp = Math.floor(new Date(tx.metadata.blockTimestamp).getTime() / 1000)
        return blockTimestamp >= seventyTwoHoursAgo
      }
      return false
    })

    // Transform to a more usable format
    return recentTransactions.map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value || "0",
      asset: tx.asset || "ETH",
      category: tx.category,
      blockNumber: tx.blockNum,
      metadata: tx.metadata
    }))

  } catch (error) {
    console.error(`Error fetching transactions for ${address} on ${chain}:`, error)
    return []
  }
}

/**
 * Main job processor function
 */
export async function processDetectUserActivityJob(jobData: DetectUserActivityJob): Promise<void> {
  const { userId } = jobData
  
  if (!userId) {
    throw new Error('userId is required for detect-user-activity job')
  }

  await detectUserActivity(userId)
}

// Standalone script execution for testing
if (require.main === module) {
  const userId = process.argv[2]
  
  if (!userId) {
    console.error('Please provide a userId as argument')
    process.exit(1)
  }

  processDetectUserActivityJob({ userId })
    .then(() => {
      console.log('Activity detection job completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Activity detection job failed:', error)
      process.exit(1)
    })
}