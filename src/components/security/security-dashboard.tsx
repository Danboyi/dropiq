'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Clock,
  Eye,
  Activity,
  Zap,
  Target,
  Lock,
  Unlock,
  Fish,
  Bug
} from 'lucide-react';

interface DashboardData {
  overview: {
    securityScore: number;
    activeAlerts: number;
    totalIncidents: number;
    openIncidents: number;
    resolvedIncidents: number;
  };
  threats: {
    scamReports: number;
    drainerDetections: number;
    phishingDetections: number;
    blacklistEntries: number;
  };
  impact: {
    affectedUsers: number;
    estimatedLosses: number;
    averageResolutionTime: number;
  };
  incidents: {
    metrics: any;
    recent: Array<{
      id: string;
      incidentType: string;
      severity: string;
      title: string;
      status: string;
      createdAt: string;
      affectedUsers: number;
      estimatedLoss?: number;
    }>;
  };
  trends: {
    daily: Array<{ date: string; count: number }>;
    byType: Record<string, Array<{ date: string; count: number }>>;
  };
}

interface SecurityAlert {
  id: string;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  createdAt: string;
  actionRequired: boolean;
  actionType?: string;
  actionUrl?: string;
}

export default function SecurityDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchDashboardData();
    fetchAlerts();
    
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchAlerts();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [timeframe]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`/api/security/home?timeframe=${timeframe}`);
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/security/alerts');
      const result = await response.json();
      
      if (result.success) {
        setAlerts(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const handleAlertAction = async (alertId: string, action: 'acknowledge' | 'dismiss') => {
    try {
      const response = await fetch('/api/security/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId,
          userId: 'current-user', // This would come from auth context
          action
        })
      });

      if (response.ok) {
        fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to handle alert action:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getSecurityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Failed to load security dashboard</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-gray-600">Monitor and manage security threats</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Active Security Alerts</h2>
          {alerts.slice(0, 3).map((alert) => (
            <Alert key={alert.id} className={`border-l-4 ${getSeverityColor(alert.severity)} border-l-4`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="flex items-center justify-between">
                <span>{alert.title}</span>
                <div className="flex items-center space-x-2">
                  <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {alert.severity.toUpperCase()}
                  </Badge>
                  {alert.actionRequired && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAlertAction(alert.id, 'acknowledge')}
                    >
                      Acknowledge
                    </Button>
                  )}
                </div>
              </AlertTitle>
              <AlertDescription>
                {alert.message}
                <div className="mt-2 text-xs text-gray-500">
                  {formatDate(alert.createdAt)}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className={getSecurityScoreColor(dashboardData.overview.securityScore)}>
                {dashboardData.overview.securityScore}%
              </span>
            </div>
            <Progress value={dashboardData.overview.securityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Overall platform security
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.overview.activeAlerts === 0 ? 'No active threats' : 'Requires attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.overview.openIncidents}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.overview.resolvedIncidents} resolved this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(dashboardData.impact.affectedUsers)}</div>
            <p className="text-xs text-muted-foreground">
              Users impacted by incidents
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="threats" className="space-y-4">
        <TabsList>
          <TabsTrigger value="threats">Threats</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="impact">Impact</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="threats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scam Reports</CardTitle>
                <Target className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {dashboardData.threats.scamReports}
                </div>
                <p className="text-xs text-muted-foreground">
                  Reported this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drainer Detections</CardTitle>
                <Unlock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {dashboardData.threats.drainerDetections}
                </div>
                <p className="text-xs text-muted-foreground">
                  Confirmed threats
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Phishing Sites</CardTitle>
                <Fish className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {dashboardData.threats.phishingDetections}
                </div>
                <p className="text-xs text-muted-foreground">
                  Blocked sites
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Blacklist Entries</CardTitle>
                <Lock className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {dashboardData.threats.blacklistEntries}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active blocks
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>
                Latest security incidents and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.incidents.recent.map((incident) => (
                  <div key={incident.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${getSeverityColor(incident.severity)}`}></div>
                      <div>
                        <h4 className="font-medium">{incident.title}</h4>
                        <p className="text-sm text-gray-600">
                          {incident.incidentType} • {incident.affectedUsers} users affected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={incident.status === 'resolved' ? 'default' : 'secondary'}>
                        {incident.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatDate(incident.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  ${formatNumber(dashboardData.impact.estimatedLosses)}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Estimated losses this period
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(dashboardData.impact.averageResolutionTime)}h
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Average time to resolve incidents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {formatNumber(dashboardData.impact.affectedUsers)}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Users affected by incidents
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incident Trends</CardTitle>
              <CardDescription>
                Security incident trends over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                  <p>Trend charts would be displayed here</p>
                  <p className="text-sm">Integration with charting library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}