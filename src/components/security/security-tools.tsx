'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Upload,
  Link,
  FileText,
  Flag,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Info,
  Zap,
  Lock,
  Unlock,
  Target,
  Fish,
  Bug
} from 'lucide-react';

interface ScanResult {
  success: boolean;
  data: {
    isScam?: boolean;
    isDrainer?: boolean;
    isPhishing?: boolean;
    confidence: number;
    riskScore: number;
    severity: string;
    redFlags?: any[];
    warnings?: string[];
    recommendations?: string[];
    analysis?: any;
  };
}

export default function SecurityTools() {
  const [activeTab, setActiveTab] = useState('project-scan');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Project scan state
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    website: '',
    contractAddress: '',
    blockchain: 'ethereum'
  });

  // Contract check state
  const [contractAddress, setContractAddress] = useState('');
  const [blockchain, setBlockchain] = useState('ethereum');

  // URL check state
  const [url, setUrl] = useState('');

  // Incident report state
  const [incidentData, setIncidentData] = useState({
    incidentType: 'scam',
    title: '',
    description: '',
    evidence: ''
  });

  const handleProjectScan = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/security/scan-project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectData })
      });

      const result = await response.json();
      
      if (result.success) {
        setResults(result);
      } else {
        setError(result.error || 'Scan failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContractCheck = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/security/check-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractAddress, blockchain })
      });

      const result = await response.json();
      
      if (result.success) {
        setResults(result);
      } else {
        setError(result.error || 'Check failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUrlCheck = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch('/api/security/check-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url })
      });

      const result = await response.json();
      
      if (result.success) {
        setResults(result);
      } else {
        setError(result.error || 'Check failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/security/report-incident', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incidentData: {
            ...incidentData,
            reporterId: 'current-user' // This would come from auth context
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Incident reported successfully!');
        setIncidentData({
          incidentType: 'scam',
          title: '',
          description: '',
          evidence: ''
        });
      } else {
        setError(result.error || 'Report failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (isThreat: boolean) => {
    if (isThreat) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security Tools</h1>
        <p className="text-gray-600">Comprehensive security analysis and protection tools</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="project-scan">Project Scan</TabsTrigger>
          <TabsTrigger value="contract-check">Contract Check</TabsTrigger>
          <TabsTrigger value="url-check">URL Check</TabsTrigger>
          <TabsTrigger value="report-incident">Report Incident</TabsTrigger>
        </TabsList>

        <TabsContent value="project-scan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Project Security Scan</span>
              </CardTitle>
              <CardDescription>
                Analyze projects for potential scams and security risks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="project-name">Project Name *</Label>
                  <Input
                    id="project-name"
                    value={projectData.name}
                    onChange={(e) => setProjectData({...projectData, name: e.target.value})}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <Label htmlFor="blockchain">Blockchain *</Label>
                  <Select value={projectData.blockchain} onValueChange={(value) => setProjectData({...projectData, blockchain: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="bsc">BSC</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="arbitrum">Arbitrum</SelectItem>
                      <SelectItem value="optimism">Optimism</SelectItem>
                      <SelectItem value="avalanche">Avalanche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="project-description">Description *</Label>
                <Textarea
                  id="project-description"
                  value={projectData.description}
                  onChange={(e) => setProjectData({...projectData, description: e.target.value})}
                  placeholder="Describe the project and its purpose"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={projectData.website}
                    onChange={(e) => setProjectData({...projectData, website: e.target.value})}
                    placeholder="https://example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="contract-address">Contract Address</Label>
                  <Input
                    id="contract-address"
                    value={projectData.contractAddress}
                    onChange={(e) => setProjectData({...projectData, contractAddress: e.target.value})}
                    placeholder="0x..."
                  />
                </div>
              </div>

              <Button 
                onClick={handleProjectScan} 
                disabled={loading || !projectData.name || !projectData.description}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Scan Project
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contract-check" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bug className="h-5 w-5" />
                <span>Smart Contract Analysis</span>
              </CardTitle>
              <CardDescription>
                Check smart contracts for drainer functionality and security vulnerabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contract-address-check">Contract Address *</Label>
                  <Input
                    id="contract-address-check"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
                <div>
                  <Label htmlFor="blockchain-check">Blockchain *</Label>
                  <Select value={blockchain} onValueChange={setBlockchain}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ethereum">Ethereum</SelectItem>
                      <SelectItem value="bsc">BSC</SelectItem>
                      <SelectItem value="polygon">Polygon</SelectItem>
                      <SelectItem value="arbitrum">Arbitrum</SelectItem>
                      <SelectItem value="optimism">Optimism</SelectItem>
                      <SelectItem value="avalanche">Avalanche</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleContractCheck} 
                disabled={loading || !contractAddress}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Check Contract
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url-check" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Fish className="h-5 w-5" />
                <span>Phishing URL Check</span>
              </CardTitle>
              <CardDescription>
                Analyze URLs for phishing attempts and malicious content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="url-check">URL *</Label>
                <Input
                  id="url-check"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>

              <Button 
                onClick={handleUrlCheck} 
                disabled={loading || !url}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Checking...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Check URL
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report-incident" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flag className="h-5 w-5" />
                <span>Report Security Incident</span>
              </CardTitle>
              <CardDescription>
                Report scams, phishing attempts, or other security incidents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="incident-type">Incident Type *</Label>
                <Select value={incidentData.incidentType} onValueChange={(value) => setIncidentData({...incidentData, incidentType: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scam">Scam</SelectItem>
                    <SelectItem value="drainer">Drainer</SelectItem>
                    <SelectItem value="phishing">Phishing</SelectItem>
                    <SelectItem value="hack">Hack</SelectItem>
                    <SelectItem value="vulnerability">Vulnerability</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="incident-title">Title *</Label>
                <Input
                  id="incident-title"
                  value={incidentData.title}
                  onChange={(e) => setIncidentData({...incidentData, title: e.target.value})}
                  placeholder="Brief description of the incident"
                />
              </div>

              <div>
                <Label htmlFor="incident-description">Description *</Label>
                <Textarea
                  id="incident-description"
                  value={incidentData.description}
                  onChange={(e) => setIncidentData({...incidentData, description: e.target.value})}
                  placeholder="Detailed description of what happened"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="incident-evidence">Evidence</Label>
                <Textarea
                  id="incident-evidence"
                  value={incidentData.evidence}
                  onChange={(e) => setIncidentData({...incidentData, evidence: e.target.value})}
                  placeholder="Links, screenshots, transaction hashes, or other evidence"
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleIncidentReport} 
                disabled={loading || !incidentData.title || !incidentData.description}
                className="w-full"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Reporting...
                  </>
                ) : (
                  <>
                    <Flag className="h-4 w-4 mr-2" />
                    Report Incident
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Results Section */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                {getRiskIcon(results.data.isScam || results.data.isDrainer || results.data.isPhishing)}
                <span>Analysis Results</span>
              </span>
              <Badge className={getSeverityColor(results.data.severity)}>
                {results.data.severity.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Risk Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Risk Score</span>
                <span className="text-sm font-bold">{results.data.riskScore}%</span>
              </div>
              <Progress value={results.data.riskScore} className="h-2" />
              <p className="text-xs text-gray-600 mt-1">
                Confidence: {results.data.confidence}%
              </p>
            </div>

            {/* Verdict */}
            <div className={`p-4 rounded-lg border ${getSeverityColor(results.data.severity)}`}>
              <div className="flex items-center space-x-2 mb-2">
                {getRiskIcon(results.data.isScam || results.data.isDrainer || results.data.isPhishing)}
                <span className="font-medium">
                  {results.data.isScam ? 'SCAM DETECTED' : 
                   results.data.isDrainer ? 'DRAINER DETECTED' : 
                   results.data.isPhishing ? 'PHISHING DETECTED' : 
                   'NO THREATS DETECTED'}
                </span>
              </div>
              <p className="text-sm">
                {results.data.isScam ? 'This project shows multiple indicators of being a scam. Exercise extreme caution.' :
                 results.data.isDrainer ? 'This contract contains drainer functionality. DO NOT interact with it.' :
                 results.data.isPhishing ? 'This URL appears to be a phishing site. Do not enter any information.' :
                 'No immediate threats detected, but always exercise caution.'}
              </p>
            </div>

            {/* Warnings */}
            {results.data.warnings && results.data.warnings.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span>Warnings</span>
                </h4>
                <ul className="space-y-1">
                  {results.data.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {results.data.recommendations && results.data.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-500" />
                  <span>Recommendations</span>
                </h4>
                <ul className="space-y-1">
                  {results.data.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Red Flags */}
            {results.data.redFlags && results.data.redFlags.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span>Red Flags</span>
                </h4>
                <div className="space-y-2">
                  {results.data.redFlags.map((flag, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {flag.severity}
                        </Badge>
                        <span className="text-sm">{flag.description}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(flag.weight * 100)}% weight
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4 border-t">
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Results
              </Button>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Share Report
              </Button>
              {results.data.isScam || results.data.isDrainer || results.data.isPhishing ? (
                <Button variant="destructive" size="sm">
                  <Flag className="h-4 w-4 mr-2" />
                  Report to Authorities
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}