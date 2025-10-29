'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  ShieldCheck, 
  AlertTriangle, 
  X, 
  ExternalLink, 
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface RedFlag {
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityAnalysisResponse {
  riskScore: number; // 0-100
  recommendation: 'SAFE' | 'CAUTION' | 'AVOID';
  redFlags: RedFlag[];
  analysis: {
    blacklistCheck: boolean;
    goPlusAnalysis?: any;
    phishingCheck: boolean;
    additionalChecks: string[];
  };
}

interface SecurityShieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  contractAddress?: string;
  onProceed: () => void;
}

export function SecurityShieldModal({ 
  isOpen, 
  onClose, 
  url, 
  contractAddress,
  onProceed 
}: SecurityShieldModalProps) {
  const [securityData, setSecurityData] = useState<SecurityAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSecurityCheck = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const requestBody: any = { url };
      if (contractAddress) {
        requestBody.contractAddress = contractAddress;
      }

      const response = await fetch('/api/security/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Security analysis failed');
      }

      const data = await response.json();
      setSecurityData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze security');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      performSecurityCheck();
    } else {
      setSecurityData(null);
      setError(null);
      onClose();
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 30) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'SAFE': return 'bg-green-500';
      case 'CAUTION': return 'bg-yellow-500';
      case 'AVOID': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'high': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatUrl = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname;
    } catch {
      return urlString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <DialogTitle>Enhanced Security Analysis</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Comprehensive security analysis powered by GoPlus Labs and threat intelligence
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* URL/Contract Display */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium text-muted-foreground mb-2">Analysis Target:</p>
            {url && (
              <div className="mb-2">
                <p className="text-xs text-muted-foreground">URL:</p>
                <p className="font-mono text-sm break-all">{formatUrl(url)}</p>
              </div>
            )}
            {contractAddress && (
              <div>
                <p className="text-xs text-muted-foreground">Contract:</p>
                <p className="font-mono text-sm break-all">{contractAddress}</p>
              </div>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="text-muted-foreground">Running comprehensive security analysis...</span>
              </div>
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p>• Checking blacklist databases</p>
                <p>• Analyzing contract security (GoPlus Labs)</p>
                <p>• Scanning for phishing patterns</p>
                <p>• Calculating risk score</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Security Results */}
          {securityData && !isLoading && (
            <div className="space-y-6">
              {/* Risk Score Display */}
              <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-background to-muted/20">
                <div className="mb-4">
                  <div className={`text-6xl font-bold ${getRiskScoreColor(securityData.riskScore)}`}>
                    {securityData.riskScore}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Risk Score (0-100)</p>
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge 
                    variant="secondary" 
                    className={`${getRecommendationColor(securityData.recommendation)} text-white px-4 py-2 text-lg`}
                  >
                    {securityData.recommendation}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  {securityData.recommendation === 'SAFE' && '✅ This appears to be safe to proceed'}
                  {securityData.recommendation === 'CAUTION' && '⚠️ Proceed with caution and verify carefully'}
                  {securityData.recommendation === 'AVOID' && '🚨 HIGH RISK - Avoid proceeding if possible'}
                </div>
              </div>

              {/* Analysis Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 border rounded-lg text-center ${
                  securityData.analysis.blacklistCheck ? 'bg-red-50 border-red-200 dark:bg-red-950/20' : 'bg-green-50 border-green-200 dark:bg-green-950/20'
                }`}>
                  <div className="text-2xl mb-2">
                    {securityData.analysis.blacklistCheck ? '🚫' : '✅'}
                  </div>
                  <p className="font-medium text-sm">Blacklist Check</p>
                  <p className="text-xs text-muted-foreground">
                    {securityData.analysis.blacklistCheck ? 'Found in blacklist' : 'Clean'}
                  </p>
                </div>

                <div className={`p-4 border rounded-lg text-center ${
                  securityData.analysis.goPlusAnalysis ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20' : 'bg-gray-50 border-gray-200 dark:bg-gray-950/20'
                }`}>
                  <div className="text-2xl mb-2">🔍</div>
                  <p className="font-medium text-sm">Contract Analysis</p>
                  <p className="text-xs text-muted-foreground">
                    {securityData.analysis.goPlusAnalysis ? 'GoPlus Labs data' : 'Not applicable'}
                  </p>
                </div>

                <div className={`p-4 border rounded-lg text-center ${
                  securityData.analysis.phishingCheck ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20' : 'bg-green-50 border-green-200 dark:bg-green-950/20'
                }`}>
                  <div className="text-2xl mb-2">
                    {securityData.analysis.phishingCheck ? '🎣' : '🛡️'}
                  </div>
                  <p className="font-medium text-sm">Phishing Scan</p>
                  <p className="text-xs text-muted-foreground">
                    {securityData.analysis.phishingCheck ? 'Suspicious patterns' : 'No threats detected'}
                  </p>
                </div>
              </div>

              {/* Red Flags */}
              {securityData.redFlags.length > 0 && (
                <div className="space-y-3">
                  <p className="font-medium text-sm text-red-600 dark:text-red-400">
                    🚨 Security Issues Found ({securityData.redFlags.length})
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {securityData.redFlags.map((flag, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                        {getSeverityIcon(flag.severity)}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{flag.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Type: {flag.type.replace('_', ' ').toUpperCase()} • Severity: {flag.severity.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Tips */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      Security Best Practices
                    </p>
                    <ul className="text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Always verify the website URL before connecting your wallet</li>
                      <li>• Never share your private keys or seed phrase with anyone</li>
                      <li>• Be cautious of sites that promise unrealistic returns</li>
                      <li>• Consider using a separate wallet for airdrop hunting</li>
                      <li>• Double-check contract addresses before approving transactions</li>
                      <li>• Start with small test transactions when using new platforms</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!isLoading && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={onProceed}
                className="flex-1"
                variant={securityData?.recommendation === 'SAFE' ? "default" : "destructive"}
                disabled={!securityData}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {securityData?.recommendation === 'AVOID' ? 'Proceed at Your Own Risk' : 'Proceed to Site'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook for using the security shield
export function useSecurityShield() {
  const [isOpen, setIsOpen] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [targetContract, setTargetContract] = useState<string>('');
  const [onProceed, setOnProceed] = useState<(() => void) | null>(null);

  const showSecurityShield = (url: string, proceedCallback: () => void, contractAddress?: string) => {
    setTargetUrl(url);
    setTargetContract(contractAddress || '');
    setOnProceed(() => proceedCallback);
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTargetUrl('');
    setTargetContract('');
    setOnProceed(null);
  };

  const handleProceed = () => {
    if (onProceed) {
      onProceed();
    }
    handleClose();
  };

  return {
    showSecurityShield,
    SecurityShieldModal: () => (
      <SecurityShieldModal
        isOpen={isOpen}
        onClose={handleClose}
        url={targetUrl}
        contractAddress={targetContract}
        onProceed={handleProceed}
      />
    )
  };
}