import { SecurityScan, TransactionSimulation } from '@/types/wallet';
import { getChainById } from './chains';

export interface SecurityThreat {
  type: 'drainer' | 'phishing' | 'malicious_contract' | 'approval_hijack' | 'front_running';
  description: string;
  severity: number; // 1-10
  confidence: number; // 0-1
  indicators: string[];
}

export interface DrainerPattern {
  signature: string;
  description: string;
  severity: 'high' | 'critical';
  commonContracts: string[];
}

export interface PhishingIndicator {
  type: 'domain' | 'contract' | 'signature' | 'social_engineering';
  pattern: string;
  description: string;
}

export class SecurityScanner {
  private knownDrainers: Set<string>;
  private knownPhishingSites: Set<string>;
  private suspiciousPatterns: DrainerPattern[];
  private phishingIndicators: PhishingIndicator[];

  constructor() {
    this.knownDrainers = new Set([
      '0x0000000000000000000000000000000000000000', // Example addresses
      '0x1234567890123456789012345678901234567890',
    ]);

    this.knownPhishingSites = new Set([
      'phishing-site.com',
      'fake-dapp.example',
    ]);

    this.suspiciousPatterns = [
      {
        signature: '0x095ea7b3', // approve function
        description: 'Unlimited token approval detected',
        severity: 'high',
        commonContracts: [],
      },
      {
        signature: '0xa9059cbb', // transfer function
        description: 'Large token transfer to unknown address',
        severity: 'medium',
        commonContracts: [],
      },
    ];

    this.phishingIndicators = [
      {
        type: 'domain',
        pattern: 'metamask.io',
        description: 'Official MetaMask domain',
      },
      {
        type: 'contract',
        pattern: '0x00000000',
        description: 'Zero address contract',
      },
    ];
  }

  /**
   * Scan an address for security threats
   */
  async scanAddress(address: string, chainId: number = 1): Promise<SecurityScan> {
    const threats: SecurityThreat[] = [];
    
    // Check against known malicious addresses
    if (this.knownDrainers.has(address.toLowerCase())) {
      threats.push({
        type: 'drainer',
        description: 'Address is known to be associated with drainer attacks',
        severity: 10,
        confidence: 1.0,
        indicators: ['Known drainer address'],
      });
    }

    // Analyze transaction patterns
    const transactionThreats = await this.analyzeTransactionPatterns(address, chainId);
    threats.push(...transactionThreats);

    // Check for suspicious approvals
    const approvalThreats = await this.checkSuspiciousApprovals(address, chainId);
    threats.push(...approvalThreats);

    // Analyze contract interactions
    const contractThreats = await this.analyzeContractInteractions(address, chainId);
    threats.push(...contractThreats);

    // Determine overall risk level
    const riskLevel = this.calculateRiskLevel(threats);

    // Generate recommendations
    const recommendations = this.generateRecommendations(threats, riskLevel);

    return {
      address,
      riskLevel,
      threats,
      recommendations,
      scannedAt: new Date(),
    };
  }

  /**
   * Simulate a transaction before execution
   */
  async simulateTransaction(
    from: string,
    to: string,
    data: string,
    value: string,
    chainId: number = 1
  ): Promise<TransactionSimulation> {
    const chain = getChainById(chainId);
    if (!chain) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    // Perform simulation using eth_call
    const simulationResult = await this.performSimulation(from, to, data, value, chain);
    
    // Analyze for potential risks
    const potentialRisks = await this.analyzeTransactionRisks(to, data, value);
    
    // Extract state changes
    const stateChanges = this.extractStateChanges(simulationResult);

    // Estimate gas
    const gasEstimate = await this.estimateGas(from, to, data, value, chain);

    return {
      from,
      to,
      data,
      value,
      gasEstimate,
      potentialRisks,
      stateChanges,
    };
  }

  /**
   * Check if a website is a phishing site
   */
  async checkPhishingSite(url: string): Promise<{
    isPhishing: boolean;
    confidence: number;
    threats: PhishingIndicator[];
  }> {
    const threats: PhishingIndicator[] = [];
    let isPhishing = false;
    let confidence = 0;

    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Check against known phishing sites
      if (this.knownPhishingSites.has(domain)) {
        isPhishing = true;
        confidence = 1.0;
        threats.push({
          type: 'domain',
          pattern: domain,
          description: 'Known phishing site',
        });
      }

      // Check for suspicious domain patterns
      const suspiciousPatterns = [
        /metamask.*\.tk$/,
        /.*-metamask\.com$/,
        /metamask.*\.xyz$/,
        /.*-connect\.com$/,
      ];

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(domain)) {
          isPhishing = true;
          confidence = Math.max(confidence, 0.7);
          threats.push({
            type: 'domain',
            pattern: pattern.source,
            description: 'Suspicious domain pattern',
          });
        }
      }

      // Check for typosquatting
      const legitimateDomains = ['metamask.io', 'app.uniswap.org', 'opensea.io'];
      for (const legitDomain of legitimateDomains) {
        if (this.isTyposquatting(domain, legitDomain)) {
          isPhishing = true;
          confidence = Math.max(confidence, 0.8);
          threats.push({
            type: 'domain',
            pattern: domain,
            description: `Possible typosquatting of ${legitDomain}`,
          });
        }
      }
    } catch (error) {
      console.error('Error checking phishing site:', error);
    }

    return { isPhishing, confidence, threats };
  }

  private async analyzeTransactionPatterns(address: string, chainId: number): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    // This would analyze recent transactions for suspicious patterns
    // For now, return empty array
    return threats;
  }

  private async checkSuspiciousApprovals(address: string, chainId: number): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    // Check for unlimited approvals to unknown contracts
    // This would require fetching ERC-20 approval events
    
    return threats;
  }

  private async analyzeContractInteractions(address: string, chainId: number): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    // Analyze which contracts the address has interacted with
    // Check against known malicious contracts
    
    return threats;
  }

  private calculateRiskLevel(threats: SecurityThreat[]): 'low' | 'medium' | 'high' | 'critical' {
    if (threats.length === 0) return 'low';

    const maxSeverity = Math.max(...threats.map(t => t.severity));
    const highSeverityCount = threats.filter(t => t.severity >= 7).length;

    if (maxSeverity >= 9 || highSeverityCount >= 2) return 'critical';
    if (maxSeverity >= 7 || highSeverityCount >= 1) return 'high';
    if (maxSeverity >= 4) return 'medium';
    return 'low';
  }

  private generateRecommendations(threats: SecurityThreat[], riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'critical') {
      recommendations.push('IMMEDIATE ACTION REQUIRED: This address shows critical security threats');
      recommendations.push('Revoke all token approvals immediately');
      recommendations.push('Transfer funds to a new secure wallet');
      recommendations.push('Do not interact with any dApps until resolved');
    } else if (riskLevel === 'high') {
      recommendations.push('Review and revoke suspicious token approvals');
      recommendations.push('Be cautious with new transactions');
      recommendations.push('Consider using a hardware wallet for additional security');
    } else if (riskLevel === 'medium') {
      recommendations.push('Regularly review your transaction history');
      recommendations.push('Use transaction simulation before signing');
      recommendations.push('Keep your wallet software updated');
    } else {
      recommendations.push('Continue practicing good wallet security');
      recommendations.push('Always verify transaction details before signing');
      recommendations.push('Use hardware wallets for large amounts');
    }

    // Add specific recommendations based on threat types
    const threatTypes = new Set(threats.map(t => t.type));
    
    if (threatTypes.has('drainer')) {
      recommendations.push('DRAINER DETECTED: Immediately disconnect from all dApps');
    }
    
    if (threatTypes.has('phishing')) {
      recommendations.push('PHISHING RISK: Only interact with official verified websites');
    }
    
    if (threatTypes.has('approval_hijack')) {
      recommendations.push('APPROVAL RISK: Review and limit token approvals');
    }

    return recommendations;
  }

  private async performSimulation(
    from: string,
    to: string,
    data: string,
    value: string,
    chain: any
  ): Promise<any> {
    // This would use eth_call to simulate the transaction
    // For now, return mock data
    return {
      success: true,
      returnData: '0x',
      gasUsed: '21000',
    };
  }

  private async analyzeTransactionRisks(
    to: string,
    data: string,
    value: string
  ): Promise<Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }>> {
    const risks: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high' }> = [];

    // Check for known drainer contracts
    if (this.knownDrainers.has(to.toLowerCase())) {
      risks.push({
        type: 'drainer_contract',
        description: 'Transaction to known drainer contract',
        severity: 'high',
      });
    }

    // Check for unlimited approval
    if (data.startsWith('0x095ea7b3') && data.includes('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')) {
      risks.push({
        type: 'unlimited_approval',
        description: 'Unlimited token approval detected',
        severity: 'high',
      });
    }

    // Check for large value transfers
    const valueWei = BigInt(value || '0');
    if (valueWei > BigInt('100000000000000000000')) { // > 100 ETH
      risks.push({
        type: 'large_transfer',
        description: 'Large value transfer detected',
        severity: 'medium',
      });
    }

    // Check for suspicious function signatures
    const suspiciousSignatures = [
      '0x', // Empty data
      '0xa9059cbb', // transfer
      '0x23b872dd', // transferFrom
    ];

    for (const sig of suspiciousSignatures) {
      if (data.startsWith(sig)) {
        risks.push({
          type: 'suspicious_function',
          description: `Suspicious function call: ${sig}`,
          severity: 'low',
        });
      }
    }

    return risks;
  }

  private extractStateChanges(simulationResult: any): {
    tokenTransfers: Array<{ token: string; from: string; to: string; amount: string }>;
    balanceChanges: Array<{ address: string; change: string }>;
  } {
    // This would parse the simulation result to extract state changes
    // For now, return empty arrays
    return {
      tokenTransfers: [],
      balanceChanges: [],
    };
  }

  private async estimateGas(
    from: string,
    to: string,
    data: string,
    value: string,
    chain: any
  ): Promise<string> {
    // This would use eth_estimateGas
    // For now, return a default value
    return '21000';
  }

  private isTyposquatting(domain: string, legitimateDomain: string): boolean {
    // Simple typosquatting detection
    const distance = this.levenshteinDistance(domain, legitimateDomain);
    return distance <= 2 && domain !== legitimateDomain;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}