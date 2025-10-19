import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export interface PhishingDetectionResult {
  isPhishing: boolean;
  confidence: number; // 0-100
  riskScore: number; // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical';
  phishingType: 'credential_harvesting' | 'wallet_drain' | 'fake_airdrop' | 'impersonation' | 'malware' | 'none';
  targetBrand?: string;
  similarityScore: number; // 0-100
  warnings: string[];
  recommendations: string[];
  analysis: {
    urlAnalysis: UrlAnalysis;
    contentAnalysis: ContentAnalysis;
    domainAnalysis: DomainAnalysis;
    sslAnalysis: SslAnalysis;
    hostingAnalysis: HostingAnalysis;
  };
}

export interface UrlAnalysis {
  url: string;
  domain: string;
  subdomain: string;
  path: string;
  queryParams: string[];
  hasSuspiciousParams: boolean;
  urlLength: number;
  hasIpAddress: boolean;
  hasShortener: boolean;
  hasUnicode: boolean;
  hasTyposquatting: boolean;
  suspiciousKeywords: string[];
}

export interface ContentAnalysis {
  title: string;
  description: string;
  hasLoginForm: boolean;
  hasWalletConnect: boolean;
  hasMetaMask: boolean;
  hasPhishingKeywords: boolean;
  pressureTactics: boolean;
  urgencyIndicators: boolean;
  fakeSocialProof: boolean;
  maliciousScripts: boolean;
  externalLinks: ExternalLink[];
  forms: FormAnalysis[];
}

export interface ExternalLink {
  url: string;
  text: string;
  suspicious: boolean;
  reason?: string;
}

export interface FormAnalysis {
  type: 'login' | 'wallet' | 'seed' | 'private_key' | 'other';
  action: string;
  fields: FormField[];
  suspicious: boolean;
  reason?: string;
}

export interface FormField {
  name: string;
  type: string;
  placeholder?: string;
  required: boolean;
  suspicious: boolean;
  reason?: string;
}

export interface DomainAnalysis {
  domain: string;
  registeredDate?: Date;
  expiryDate?: Date;
  registrar?: string;
  registrant?: string;
  whoisPrivacy: boolean;
  dnsRecords: DnsRecord[];
  nameServers: string[];
  mxRecords: string[];
  txtRecords: string[];
  domainReputation: number; // 0-100
  blacklisted: boolean;
}

export interface DnsRecord {
  type: string;
  value: string;
  ttl: number;
}

export interface SslAnalysis {
  hasSsl: boolean;
  sslValid: boolean;
  issuer: string;
  subject: string;
  validFrom: Date;
  validTo: Date;
  isSelfSigned: boolean;
  certificateChain: string[];
  sslVersion: string;
  cipherSuite: string;
}

export interface HostingAnalysis {
  ipAddress: string;
  isp: string;
  organization: string;
  country: string;
  region: string;
  city: string;
  isHostingProvider: boolean;
  isKnownBadHost: boolean;
  reputation: number; // 0-100
  asn: string;
  reverseDns: string;
}

export class PhishingProtectionEngine {
  private zai: ZAI;
  private knownPhishingPatterns: Map<string, any>;
  private legitimateDomains: Set<string>;
  private suspiciousKeywords: string[];

  constructor() {
    this.zai = null as any;
    this.knownPhishingPatterns = new Map();
    this.legitimateDomains = new Set();
    this.suspiciousKeywords = [
      'verify', 'suspend', 'limited', 'urgent', 'immediate', 'action required',
      'security alert', 'unusual activity', 'confirm', 'update', 'restore',
      'wallet compromised', 'private key', 'seed phrase', 'mnemonic',
      'connect wallet', 'approve transaction', 'claim bonus', 'free airdrop'
    ];
    this.initializeLegitimateDomains();
  }

  private async initializeZAI() {
    if (!this.zai) {
      this.zai = await ZAI.create();
    }
  }

  private initializeLegitimateDomains() {
    // Add known legitimate domains
    this.legitimateDomains.add('uniswap.org');
    this.legitimateDomains.add('pancakeswap.finance');
    this.legitimateDomains.add('metamask.io');
    this.legitimateDomains.add('trustwallet.com');
    this.legitimateDomains.add('coinbase.com');
    this.legitimateDomains.add('binance.com');
    this.legitimateDomains.add('opensea.io');
    this.legitimateDomains.add('etherscan.io');
    this.legitimateDomains.add('coingecko.com');
    this.legitimateDomains.add('coinmarketcap.com');
    // Add more as needed
  }

  async analyzeUrl(url: string): Promise<PhishingDetectionResult> {
    await this.initializeZAI();

    // Check if already analyzed and cached
    const existingDetection = await db.phishingDetection.findUnique({
      where: { url }
    });

    if (existingDetection && existingDetection.status === 'confirmed') {
      return this.formatDetectionResult(existingDetection);
    }

    // Parse and analyze URL
    const urlAnalysis = this.analyzeUrlStructure(url);
    
    // Analyze domain
    const domainAnalysis = await this.analyzeDomain(urlAnalysis.domain);
    
    // Analyze content (if accessible)
    const contentAnalysis = await this.analyzeContent(url);
    
    // Analyze SSL certificate
    const sslAnalysis = await this.analyzeSsl(urlAnalysis.domain);
    
    // Analyze hosting information
    const hostingAnalysis = await this.analyzeHosting(urlAnalysis.domain);

    // Check for typosquatting
    const similarityScore = this.calculateDomainSimilarity(urlAnalysis.domain);
    
    // AI-powered analysis
    const aiAnalysis = await this.performAIAnalysis({
      url,
      urlAnalysis,
      domainAnalysis,
      contentAnalysis,
      sslAnalysis,
      hostingAnalysis
    });

    // Calculate risk scores
    const riskScore = this.calculatePhishingRiskScore(
      urlAnalysis,
      domainAnalysis,
      contentAnalysis,
      sslAnalysis,
      hostingAnalysis,
      similarityScore
    );

    const confidence = this.calculateConfidence(
      urlAnalysis,
      domainAnalysis,
      contentAnalysis,
      sslAnalysis,
      hostingAnalysis
    );

    // Determine phishing type and severity
    const phishingType = this.determinePhishingType(
      urlAnalysis,
      contentAnalysis,
      domainAnalysis
    );
    
    const severity = this.determineSeverity(riskScore, phishingType);

    // Identify target brand
    const targetBrand = this.identifyTargetBrand(urlAnalysis.domain, contentAnalysis);

    // Generate warnings and recommendations
    const warnings = this.generateWarnings(
      urlAnalysis,
      domainAnalysis,
      contentAnalysis,
      severity,
      phishingType
    );

    const recommendations = this.generateRecommendations(
      urlAnalysis,
      domainAnalysis,
      contentAnalysis,
      severity,
      phishingType
    );

    const result: PhishingDetectionResult = {
      isPhishing: riskScore > 70 || severity === 'critical',
      confidence,
      riskScore,
      severity,
      phishingType,
      targetBrand,
      similarityScore,
      warnings,
      recommendations,
      analysis: {
        urlAnalysis,
        contentAnalysis,
        domainAnalysis,
        sslAnalysis,
        hostingAnalysis
      }
    };

    // Save detection result to database
    await this.saveDetectionResult(url, result);

    return result;
  }

  private analyzeUrlStructure(url: string): UrlAnalysis {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const subdomain = domain.split('.')[0];
      const path = urlObj.pathname;
      const queryParams = Array.from(urlObj.searchParams.keys());

      const hasSuspiciousParams = queryParams.some(param => 
        this.suspiciousKeywords.some(keyword => 
          param.toLowerCase().includes(keyword)
        )
      );

      const hasIpAddress = /^\d+\.\d+\.\d+\.\d+$/.test(domain);
      const hasShortener = this.isUrlShortener(domain);
      const hasUnicode = /[^\x00-\x7F]/.test(url);
      const hasTyposquatting = this.detectTyposquatting(domain);

      const suspiciousKeywords = this.extractSuspiciousKeywords(url);

      return {
        url,
        domain,
        subdomain,
        path,
        queryParams,
        hasSuspiciousParams,
        urlLength: url.length,
        hasIpAddress,
        hasShortener,
        hasUnicode,
        hasTyposquatting,
        suspiciousKeywords
      };
    } catch (error) {
      return {
        url,
        domain: '',
        subdomain: '',
        path: '',
        queryParams: [],
        hasSuspiciousParams: false,
        urlLength: url.length,
        hasIpAddress: false,
        hasShortener: false,
        hasUnicode: false,
        hasTyposquatting: false,
        suspiciousKeywords: []
      };
    }
  }

  private async analyzeDomain(domain: string): Promise<DomainAnalysis> {
    // This would integrate with WHOIS APIs and domain reputation services
    // For now, return mock data
    
    return {
      domain,
      registeredDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      registrar: 'Mock Registrar',
      registrant: 'Private Registration',
      whoisPrivacy: true,
      dnsRecords: [],
      nameServers: ['ns1.example.com', 'ns2.example.com'],
      mxRecords: [],
      txtRecords: [],
      domainReputation: 50,
      blacklisted: false
    };
  }

  private async analyzeContent(url: string): Promise<ContentAnalysis> {
    // This would fetch and analyze the actual webpage content
    // For now, return mock data
    
    return {
      title: 'Mock Title',
      description: 'Mock Description',
      hasLoginForm: false,
      hasWalletConnect: false,
      hasMetaMask: false,
      hasPhishingKeywords: false,
      pressureTactics: false,
      urgencyIndicators: false,
      fakeSocialProof: false,
      maliciousScripts: false,
      externalLinks: [],
      forms: []
    };
  }

  private async analyzeSsl(domain: string): Promise<SslAnalysis> {
    // This would analyze SSL certificate
    // For now, return mock data
    
    return {
      hasSsl: true,
      sslValid: true,
      issuer: 'Mock CA',
      subject: domain,
      validFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      validTo: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000),
      isSelfSigned: false,
      certificateChain: [],
      sslVersion: 'TLSv1.3',
      cipherSuite: 'TLS_AES_256_GCM_SHA384'
    };
  }

  private async analyzeHosting(domain: string): Promise<HostingAnalysis> {
    // This would analyze hosting information
    // For now, return mock data
    
    return {
      ipAddress: '192.168.1.1',
      isp: 'Mock ISP',
      organization: 'Mock Organization',
      country: 'US',
      region: 'California',
      city: 'San Francisco',
      isHostingProvider: true,
      isKnownBadHost: false,
      reputation: 70,
      asn: 'AS12345',
      reverseDns: domain
    };
  }

  private calculateDomainSimilarity(domain: string): number {
    let maxSimilarity = 0;

    for (const legitimateDomain of this.legitimateDomains) {
      const similarity = this.levenshteinSimilarity(domain, legitimateDomain);
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  private levenshteinSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLength = Math.max(len1, len2);
    return ((maxLength - distance) / maxLength) * 100;
  }

  private async performAIAnalysis(data: any): Promise<any> {
    try {
      const prompt = `
        Analyze this URL for phishing indicators:
        
        URL: ${data.url}
        Domain: ${data.urlAnalysis.domain}
        Has Suspicious Parameters: ${data.urlAnalysis.hasSuspiciousParams}
        Has IP Address: ${data.urlAnalysis.hasIpAddress}
        Has Unicode: ${data.urlAnalysis.hasUnicode}
        Typosquatting Detected: ${data.urlAnalysis.hasTyposquatting}
        
        Domain Age: ${data.domainAnalysis.registeredDate ? 'Recently registered' : 'Unknown'}
        WHOIS Privacy: ${data.domainAnalysis.whoisPrivacy}
        SSL Valid: ${data.sslAnalysis.sslValid}
        
        Content Analysis:
        - Has Login Form: ${data.contentAnalysis.hasLoginForm}
        - Has Wallet Connect: ${data.contentAnalysis.hasWalletConnect}
        - Has Phishing Keywords: ${data.contentAnalysis.hasPhishingKeywords}
        - Pressure Tactics: ${data.contentAnalysis.pressureTactics}
        
        Identify potential phishing attempts, social engineering tactics, and provide a risk assessment.
        Return a JSON response with your analysis.
      `;

      const response = await this.zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert cybersecurity analyst specializing in phishing detection.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {};
    }
  }

  private calculatePhishingRiskScore(
    urlAnalysis: UrlAnalysis,
    domainAnalysis: DomainAnalysis,
    contentAnalysis: ContentAnalysis,
    sslAnalysis: SslAnalysis,
    hostingAnalysis: HostingAnalysis,
    similarityScore: number
  ): number {
    let riskScore = 0;

    // URL-based risks
    if (urlAnalysis.hasIpAddress) riskScore += 30;
    if (urlAnalysis.hasShortener) riskScore += 15;
    if (urlAnalysis.hasUnicode) riskScore += 20;
    if (urlAnalysis.hasTyposquatting) riskScore += 40;
    if (urlAnalysis.hasSuspiciousParams) riskScore += 25;
    if (urlAnalysis.urlLength > 100) riskScore += 10;

    // Domain-based risks
    if (domainAnalysis.blacklisted) riskScore += 50;
    if (domainAnalysis.domainReputation < 30) riskScore += 30;
    if (domainAnalysis.whoisPrivacy) riskScore += 15;
    
    // Check domain age
    if (domainAnalysis.registeredDate) {
      const domainAge = (Date.now() - domainAnalysis.registeredDate.getTime()) / (1000 * 60 * 60 * 24);
      if (domainAge < 30) riskScore += 25;
      if (domainAge < 7) riskScore += 15;
    }

    // Content-based risks
    if (contentAnalysis.hasLoginForm) riskScore += 20;
    if (contentAnalysis.hasWalletConnect) riskScore += 25;
    if (contentAnalysis.hasMetaMask) riskScore += 20;
    if (contentAnalysis.hasPhishingKeywords) riskScore += 30;
    if (contentAnalysis.pressureTactics) riskScore += 25;
    if (contentAnalysis.urgencyIndicators) riskScore += 20;
    if (contentAnalysis.fakeSocialProof) riskScore += 15;
    if (contentAnalysis.maliciousScripts) riskScore += 40;

    // SSL-based risks
    if (!sslAnalysis.hasSsl) riskScore += 20;
    if (!sslAnalysis.sslValid) riskScore += 30;
    if (sslAnalysis.isSelfSigned) riskScore += 25;

    // Hosting-based risks
    if (hostingAnalysis.isKnownBadHost) riskScore += 40;
    if (hostingAnalysis.reputation < 30) riskScore += 20;

    // Similarity score (typosquatting)
    if (similarityScore > 80) riskScore += 35;
    if (similarityScore > 70) riskScore += 25;

    return Math.min(100, Math.round(riskScore));
  }

  private calculateConfidence(
    urlAnalysis: UrlAnalysis,
    domainAnalysis: DomainAnalysis,
    contentAnalysis: ContentAnalysis,
    sslAnalysis: SslAnalysis,
    hostingAnalysis: HostingAnalysis
  ): number {
    let confidence = 20; // Base confidence

    // Increase confidence based on available data
    if (urlAnalysis.domain) confidence += 15;
    if (domainAnalysis.registeredDate) confidence += 15;
    if (contentAnalysis.title) confidence += 15;
    if (sslAnalysis.hasSsl) confidence += 10;
    if (hostingAnalysis.ipAddress) confidence += 10;
    if (domainAnalysis.domainReputation > 0) confidence += 15;

    return Math.min(100, confidence);
  }

  private determinePhishingType(
    urlAnalysis: UrlAnalysis,
    contentAnalysis: ContentAnalysis,
    domainAnalysis: DomainAnalysis
  ): 'credential_harvesting' | 'wallet_drain' | 'fake_airdrop' | 'impersonation' | 'malware' | 'none' {
    if (contentAnalysis.hasWalletConnect || contentAnalysis.hasMetaMask) {
      return 'wallet_drain';
    }
    
    if (contentAnalysis.hasLoginForm) {
      return 'credential_harvesting';
    }
    
    if (urlAnalysis.suspiciousKeywords.some(k => k.includes('airdrop') || k.includes('bonus'))) {
      return 'fake_airdrop';
    }
    
    if (urlAnalysis.hasTyposquatting || domainAnalysis.blacklisted) {
      return 'impersonation';
    }
    
    if (contentAnalysis.maliciousScripts) {
      return 'malware';
    }
    
    return 'none';
  }

  private determineSeverity(riskScore: number, phishingType: string): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore >= 80 || phishingType === 'wallet_drain' || phishingType === 'malware') {
      return 'critical';
    }
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  private identifyTargetBrand(domain: string, contentAnalysis: ContentAnalysis): string | undefined {
    // Check if domain resembles known brands
    for (const legitimateDomain of this.legitimateDomains) {
      if (this.levenshteinSimilarity(domain, legitimateDomain) > 70) {
        return legitimateDomain;
      }
    }

    // Check content for brand mentions
    if (contentAnalysis.title) {
      const title = contentAnalysis.title.toLowerCase();
      for (const legitimateDomain of this.legitimateDomains) {
        const brandName = legitimateDomain.split('.')[0];
        if (title.includes(brandName)) {
          return legitimateDomain;
        }
      }
    }

    return undefined;
  }

  private generateWarnings(
    urlAnalysis: UrlAnalysis,
    domainAnalysis: DomainAnalysis,
    contentAnalysis: ContentAnalysis,
    severity: string,
    phishingType: string
  ): string[] {
    const warnings: string[] = [];

    if (severity === 'critical') {
      warnings.push('🚨 CRITICAL: This appears to be a phishing site!');
      warnings.push('Do NOT enter any personal information or connect your wallet');
      warnings.push('Your funds could be stolen');
    } else if (severity === 'high') {
      warnings.push('⚠️ HIGH RISK: Strong indicators of phishing detected');
      warnings.push('Exercise extreme caution');
    } else if (severity === 'medium') {
      warnings.push('⚡ MEDIUM RISK: Some suspicious characteristics detected');
      warnings.push('Proceed with caution');
    }

    // Specific warnings based on analysis
    if (urlAnalysis.hasTyposquatting) {
      warnings.push('Domain appears to be imitating a legitimate site');
    }

    if (contentAnalysis.hasWalletConnect) {
      warnings.push('Site requests wallet connection - potential drainer');
    }

    if (contentAnalysis.hasLoginForm) {
      warnings.push('Login form detected - could steal credentials');
    }

    if (!domainAnalysis.registeredDate || 
        (Date.now() - domainAnalysis.registeredDate.getTime()) < 30 * 24 * 60 * 60 * 1000) {
      warnings.push('Recently registered domain - higher risk');
    }

    if (urlAnalysis.hasIpAddress) {
      warnings.push('URL uses IP address instead of domain name');
    }

    return warnings;
  }

  private generateRecommendations(
    urlAnalysis: UrlAnalysis,
    domainAnalysis: DomainAnalysis,
    contentAnalysis: ContentAnalysis,
    severity: string,
    phishingType: string
  ): string[] {
    const recommendations: string[] = [];

    if (severity === 'critical') {
      recommendations.push('CLOSE this page immediately');
      recommendations.push('Clear your browser cache and cookies');
      recommendations.push('Scan your device for malware');
      recommendations.push('Report this phishing attempt');
    } else if (severity === 'high') {
      recommendations.push('Do NOT interact with this site');
      recommendations.push('Verify the correct URL directly');
      recommendations.push('Use bookmarked links for trusted sites');
    } else if (severity === 'medium') {
      recommendations.push('Double-check the URL spelling');
      recommendations.push('Look for HTTPS and valid certificates');
      recommendations.push('Contact the supposed company directly');
    } else {
      recommendations.push('Still exercise caution');
      recommendations.push('Verify site legitimacy before sharing information');
    }

    // Specific recommendations based on phishing type
    if (phishingType === 'wallet_drain') {
      recommendations.push('NEVER connect your wallet to suspicious sites');
      recommendations.push('Always verify contract addresses before approving');
      recommendations.push('Use a hardware wallet for additional security');
    }

    if (phishingType === 'credential_harvesting') {
      recommendations.push('Use unique passwords for each site');
      recommendations.push('Enable two-factor authentication');
      recommendations.push('Check for SSL certificates before entering credentials');
    }

    return recommendations;
  }

  private async saveDetectionResult(url: string, result: PhishingDetectionResult): Promise<void> {
    try {
      await db.phishingDetection.upsert({
        where: { url },
        update: {
          domain: result.analysis.urlAnalysis.domain,
          detectionMethod: 'url_analysis',
          status: result.isPhishing ? 'confirmed' : 'detected',
          confidence: result.confidence,
          riskScore: result.riskScore,
          severity: result.severity,
          phishingType: result.phishingType,
          targetBrand: result.targetBrand,
          similarityScore: result.similarityScore,
          contentAnalysis: result.analysis.contentAnalysis,
          sslCertificate: result.analysis.sslAnalysis,
          hostingInfo: result.analysis.hostingAnalysis,
          mitigationStatus: result.isPhishing ? 'blocked' : 'warning',
          warningMessage: result.warnings.join('; '),
          detectionDetails: result.analysis
        },
        create: {
          url,
          domain: result.analysis.urlAnalysis.domain,
          detectionMethod: 'url_analysis',
          status: result.isPhishing ? 'confirmed' : 'detected',
          confidence: result.confidence,
          riskScore: result.riskScore,
          severity: result.severity,
          phishingType: result.phishingType,
          targetBrand: result.targetBrand,
          similarityScore: result.similarityScore,
          contentAnalysis: result.analysis.contentAnalysis,
          sslCertificate: result.analysis.sslAnalysis,
          hostingInfo: result.analysis.hostingAnalysis,
          mitigationStatus: result.isPhishing ? 'blocked' : 'warning',
          warningMessage: result.warnings.join('; '),
          detectionDetails: result.analysis
        }
      });
    } catch (error) {
      console.error('Failed to save detection result:', error);
    }
  }

  private formatDetectionResult(detection: any): PhishingDetectionResult {
    return {
      isPhishing: detection.status === 'confirmed',
      confidence: detection.confidence,
      riskScore: detection.riskScore,
      severity: detection.severity,
      phishingType: detection.phishingType,
      targetBrand: detection.targetBrand,
      similarityScore: detection.similarityScore,
      warnings: detection.warningMessage ? detection.warningMessage.split('; ') : [],
      recommendations: [], // Would need to be regenerated
      analysis: {
        urlAnalysis: detection.detectionDetails?.urlAnalysis || {},
        contentAnalysis: detection.contentAnalysis || {},
        domainAnalysis: detection.detectionDetails?.domainAnalysis || {},
        sslAnalysis: detection.sslCertificate || {},
        hostingAnalysis: detection.hostingInfo || {}
      }
    };
  }

  // Helper methods
  private isUrlShortener(domain: string): boolean {
    const shorteners = [
      'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
      'buff.ly', 'adf.ly', 'bit.do', 'mcaf.ee', 'su.pr', 'go2.me'
    ];
    return shorteners.some(shortener => domain.includes(shortener));
  }

  private detectTyposquatting(domain: string): boolean {
    for (const legitimateDomain of this.legitimateDomains) {
      if (this.levenshteinSimilarity(domain, legitimateDomain) > 70 && domain !== legitimateDomain) {
        return true;
      }
    }
    return false;
  }

  private extractSuspiciousKeywords(url: string): string[] {
    const keywords = [];
    const lowerUrl = url.toLowerCase();
    
    for (const keyword of this.suspiciousKeywords) {
      if (lowerUrl.includes(keyword)) {
        keywords.push(keyword);
      }
    }
    
    return keywords;
  }
}

export const phishingProtectionEngine = new PhishingProtectionEngine();