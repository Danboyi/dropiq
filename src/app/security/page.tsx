'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Info, 
  Eye,
  ExternalLink,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/stores/authStore';

interface SecurityAlert {
  id: string;
  type: 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  project?: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  category: 'scam' | 'vulnerability' | 'market' | 'security';
}

export default function SecurityPage() {
  const { user, isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching security alerts
    const fetchAlerts = async () => {
      setLoading(true);
      
      // Mock security alerts data
      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'high',
          title: 'Phishing Attack Detected',
          description: 'A phishing website impersonating popular DeFi protocol has been detected. Do not connect your wallet to any suspicious links.',
          project: 'Fake Uniswap Clone',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          actionUrl: '#',
          category: 'scam'
        },
        {
          id: '2',
          type: 'medium',
          title: 'Smart Contract Vulnerability',
          description: 'A vulnerability has been discovered in a popular airdrop contract. Users should avoid interacting until patched.',
          project: 'TokenAirdrop Pro',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: 'vulnerability'
        },
        {
          id: '3',
          type: 'low',
          title: 'Market Volatility Alert',
          description: 'Unusual trading patterns detected for several airdropped tokens. Exercise caution with new positions.',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          category: 'market'
        },
        {
          id: '4',
          type: 'info',
          title: 'Security Best Practices',
          description: 'Remember to always verify URLs, use hardware wallets, and never share your private keys or seed phrases.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          category: 'security'
        }
      ];

      setAlerts(mockAlerts);
      setLoading(false);
    };

    if (isAuthenticated) {
      fetchAlerts();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'high':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'info':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      case 'info':
        return 'default';
      default:
        return 'outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const markAsRead = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, isRead: true } : alert
      )
    );
  };

  const filteredAlerts = {
    all: alerts,
    unread: alerts.filter(alert => !alert.isRead),
    high: alerts.filter(alert => alert.type === 'high'),
    medium: alerts.filter(alert => alert.type === 'medium'),
    low: alerts.filter(alert => alert.type === 'low'),
    info: alerts.filter(alert => alert.type === 'info')
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">
            Please sign in to access security alerts and threat intelligence
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Security Alerts</h1>
          <p className="text-muted-foreground">
            Real-time threat intelligence and security notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {alerts.filter(a => !a.isRead).length} unread
          </Badge>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {alerts.filter(a => a.type === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {alerts.filter(a => a.type === 'medium').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Exercise caution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Info</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {alerts.filter(a => a.type === 'info').length}
            </div>
            <p className="text-xs text-muted-foreground">
              General updates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Alerts</TabsTrigger>
          <TabsTrigger value="unread">Unread ({filteredAlerts.unread.length})</TabsTrigger>
          <TabsTrigger value="high">Critical</TabsTrigger>
          <TabsTrigger value="medium">Warnings</TabsTrigger>
          <TabsTrigger value="low">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <Shield className="h-8 w-8 animate-pulse mx-auto mb-2" />
              <p className="text-muted-foreground">Loading security alerts...</p>
            </div>
          ) : filteredAlerts.all.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>All Clear</AlertTitle>
              <AlertDescription>
                No security alerts at this time. Your security posture looks good!
              </AlertDescription>
            </Alert>
          ) : (
            filteredAlerts.all.map((alert) => (
              <Card key={alert.id} className={!alert.isRead ? 'border-l-4 border-l-red-500' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant={getAlertBadgeVariant(alert.type)}>
                            {alert.type.toUpperCase()}
                          </Badge>
                          {!alert.isRead && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              NEW
                            </Badge>
                          )}
                        </div>
                        {alert.project && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Project: {alert.project}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-2">
                    {alert.actionUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={alert.actionUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Learn More
                        </a>
                      </Button>
                    )}
                    {!alert.isRead && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => markAsRead(alert.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          {filteredAlerts.unread.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Caught Up!</AlertTitle>
              <AlertDescription>
                You've read all your security alerts.
              </AlertDescription>
            </Alert>
          ) : (
            filteredAlerts.unread.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant={getAlertBadgeVariant(alert.type)}>
                            {alert.type.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            NEW
                          </Badge>
                        </div>
                        {alert.project && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Project: {alert.project}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-2">
                    {alert.actionUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={alert.actionUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Learn More
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => markAsRead(alert.id)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Mark as Read
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          {filteredAlerts.high.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>No Critical Alerts</AlertTitle>
              <AlertDescription>
                No critical security alerts at this time.
              </AlertDescription>
            </Alert>
          ) : (
            filteredAlerts.high.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant="destructive">
                            CRITICAL
                          </Badge>
                        </div>
                        {alert.project && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Project: {alert.project}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-2">
                    {alert.actionUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={alert.actionUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Learn More
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="medium" className="space-y-4">
          {filteredAlerts.medium.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>No Warnings</AlertTitle>
              <AlertDescription>
                No medium-priority security alerts at this time.
              </AlertDescription>
            </Alert>
          ) : (
            filteredAlerts.medium.map((alert) => (
              <Card key={alert.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant="secondary">
                            WARNING
                          </Badge>
                        </div>
                        {alert.project && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Project: {alert.project}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-2">
                    {alert.actionUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={alert.actionUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Learn More
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="low" className="space-y-4">
          {filteredAlerts.low.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>No Info Alerts</AlertTitle>
              <AlertDescription>
                No informational alerts at this time.
              </AlertDescription>
            </Alert>
          ) : (
            filteredAlerts.low.map((alert) => (
              <Card key={alert.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{alert.title}</CardTitle>
                          <Badge variant="outline">
                            INFO
                          </Badge>
                        </div>
                        {alert.project && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Project: {alert.project}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-2">
                    {alert.actionUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={alert.actionUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Learn More
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}