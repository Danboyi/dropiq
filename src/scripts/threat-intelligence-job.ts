import { db } from '@/lib/db';

interface ThreatSource {
  name: string;
  type: 'domain' | 'contract_address';
  fetchFunction: () => Promise<string[]>;
}

// ChainAbuse API integration
async function fetchChainAbuseThreats(): Promise<string[]> {
  try {
    // Note: ChainAbuse API might require authentication
    // This is a placeholder implementation
    const response = await fetch('https://api.chainabuse.com/v0/reports', {
      headers: {
        'Accept': 'application/json',
        // Add API key if required: 'Authorization': `Bearer ${process.env.CHAINABUSE_API_KEY}`
      }
    });

    if (!response.ok) {
      throw new Error('ChainAbuse API request failed');
    }

    const data = await response.json();
    
    // Extract malicious domains and addresses from reports
    const threats: string[] = [];
    
    if (data.data && Array.isArray(data.data)) {
      data.data.forEach((report: any) => {
        // Extract domains from report
        if (report.indicators) {
          report.indicators.forEach((indicator: any) => {
            if (indicator.type === 'domain' && indicator.value) {
              threats.push(indicator.value.toLowerCase());
            }
            if (indicator.type === 'address' && indicator.value) {
              threats.push(indicator.value.toLowerCase());
            }
          });
        }
      });
    }

    return threats;
  } catch (error) {
    console.error('ChainAbuse fetch error:', error);
    return [];
  }
}

// GitHub curated threat lists
async function fetchGitHubThreatLists(): Promise<{ domains: string[], contracts: string[] }> {
  const threats = { domains: [], contracts: [] };

  try {
    // Example: Fetch from a public phishing repository
    const phishingListResponse = await fetch('https://raw.githubusercontent.com/malware-traffic-analysis.net/phishing-urls/master/phishing-urls.txt');
    
    if (phishingListResponse.ok) {
      const text = await phishingListResponse.text();
      const lines = text.split('\n');
      
      lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#')) {
          // Extract domain from URL if it's a full URL
          try {
            const url = new URL(line.startsWith('http') ? line : `https://${line}`);
            threats.domains.push(url.hostname.toLowerCase());
          } catch {
            // If it's not a valid URL, treat it as a domain
            if (line.includes('.')) {
              threats.domains.push(line.toLowerCase());
            }
          }
        }
      });
    }

    // Fetch known malicious contracts from public repositories
    const maliciousContractsResponse = await fetch('https://raw.githubusercontent.com/scamsScanners/ScamTokens/main/blacklist.txt');
    
    if (maliciousContractsResponse.ok) {
      const text = await maliciousContractsResponse.text();
      const lines = text.split('\n');
      
      lines.forEach(line => {
        line = line.trim();
        if (line && !line.startsWith('#') && line.startsWith('0x') && line.length === 42) {
          threats.contracts.push(line.toLowerCase());
        }
      });
    }

  } catch (error) {
    console.error('GitHub threat lists fetch error:', error);
  }

  return threats;
}

// Etherscan known scam contracts
async function fetchEtherscanScamContracts(): Promise<string[]> {
  try {
    // This would typically require an Etherscan API key
    // For now, we'll use some known scam contract patterns
    const knownScamPatterns = [
      // These are examples - in production, you'd fetch from real sources
      '0x0000000000000000000000000000000000000000', // Example placeholder
    ];

    return knownScamPatterns;
  } catch (error) {
    console.error('Etherscan scam contracts fetch error:', error);
    return [];
  }
}

// Main threat intelligence function
export async function updateThreatIntelligence(): Promise<void> {
  console.log('Starting threat intelligence update...');

  try {
    const allThreats = {
      domains: new Set<string>(),
      contracts: new Set<string>()
    };

    // Fetch from GitHub threat lists
    console.log('Fetching GitHub threat lists...');
    const githubThreats = await fetchGitHubThreatLists();
    githubThreats.domains.forEach(domain => allThreats.domains.add(domain));
    githubThreats.contracts.forEach(contract => allThreats.contracts.add(contract));

    // Fetch from ChainAbuse
    console.log('Fetching ChainAbuse threats...');
    const chainAbuseThreats = await fetchChainAbuseThreats();
    chainAbuseThreats.forEach(threat => {
      if (threat.startsWith('0x') && threat.length === 42) {
        allThreats.contracts.add(threat);
      } else if (threat.includes('.')) {
        allThreats.domains.add(threat);
      }
    });

    // Fetch from Etherscan
    console.log('Fetching Etherscan scam contracts...');
    const etherscanThreats = await fetchEtherscanScamContracts();
    etherscanThreats.forEach(contract => allThreats.contracts.add(contract));

    // Batch insert new threats into database
    console.log('Updating database with new threats...');
    
    const domainsToInsert = Array.from(allThreats.domains).map(domain => ({
      type: 'domain' as const,
      value: domain,
      source: 'github_threat_intelligence'
    }));

    const contractsToInsert = Array.from(allThreats.contracts).map(contract => ({
      type: 'contract_address' as const,
      value: contract,
      source: 'github_threat_intelligence'
    }));

    // Insert domains in batches
    if (domainsToInsert.length > 0) {
      await db.blacklist.createMany({
        data: domainsToInsert,
        skipDuplicates: true
      });
      console.log(`Added ${domainsToInsert.length} domains to blacklist`);
    }

    // Insert contracts in batches
    if (contractsToInsert.length > 0) {
      await db.blacklist.createMany({
        data: contractsToInsert,
        skipDuplicates: true
      });
      console.log(`Added ${contractsToInsert.length} contracts to blacklist`);
    }

    // Clean up old entries (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deletedOldEntries = await db.blacklist.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        },
        source: 'github_threat_intelligence' // Only clean up auto-fetched entries
      }
    });

    console.log(`Cleaned up ${deletedOldEntries.count} old blacklist entries`);

    console.log('Threat intelligence update completed successfully');

  } catch (error) {
    console.error('Threat intelligence update failed:', error);
    throw error;
  }
}

// Function to manually add a threat (for admin use)
export async function addThreatToBlacklist(
  type: 'domain' | 'contract_address',
  value: string,
  source: string = 'admin_manual'
): Promise<void> {
  try {
    await db.blacklist.create({
      data: {
        type,
        value: value.toLowerCase(),
        source
      }
    });
    console.log(`Added ${type} ${value} to blacklist from source: ${source}`);
  } catch (error) {
    console.error(`Failed to add threat to blacklist:`, error);
    throw error;
  }
}

// Function to remove a threat from blacklist
export async function removeThreatFromBlacklist(
  type: 'domain' | 'contract_address',
  value: string
): Promise<void> {
  try {
    await db.blacklist.deleteMany({
      where: {
        type,
        value: value.toLowerCase()
      }
    });
    console.log(`Removed ${type} ${value} from blacklist`);
  } catch (error) {
    console.error(`Failed to remove threat from blacklist:`, error);
    throw error;
  }
}

// Standalone script execution
if (require.main === module) {
  updateThreatIntelligence()
    .then(() => {
      console.log('Threat intelligence job completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Threat intelligence job failed:', error);
      process.exit(1);
    });
}