'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Info, 
  AlertCircle, 
  X,
  Bell,
  BellOff,
  Shield,
  CheckCircle
} from 'lucide-react';
import { useSecurityAlerts } from '@/hooks/use-security-alerts';
import { cn } from '@/lib/utils';

interface SecurityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  affectedPlatforms?: string[];
  recommendedActions?: string[];
  timestamp: string;
  read?: boolean;
}

export function SecurityAlerts() {
  const { isConnected, alerts, clearAlerts, markAlertAsRead, unreadCount } = useSecurityAlerts();
  const [isExpanded, setIsExpanded] = useState(false);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20';
      case 'high': return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20';
      case 'medium': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/20';
      case 'low': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20';
      default: return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950/20';
    }
  };

  const getAlertBadgeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-red-400 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BellOff className="h-4 w-4" />
            Security alerts disconnected
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle className="text-lg">Security Alerts</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? <X className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </Button>
            {alerts.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAlerts}
                className="h-8 px-2 text-xs"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm">No security alerts</p>
              <p className="text-xs">You're all protected!</p>
            </div>
          ) : (
            <ScrollArea className="h-64 w-full">
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all cursor-pointer hover:shadow-sm",
                      getAlertColor(alert.type),
                      alert.read && "opacity-60"
                    )}
                    onClick={() => markAlertAsRead(alert.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">{alert.title}</h4>
                          <Badge 
                            variant="secondary" 
                            className={cn("text-xs", getAlertBadgeColor(alert.type))}
                          >
                            {alert.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
                        
                        {alert.affectedPlatforms && alert.affectedPlatforms.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium mb-1">Affected Platforms:</p>
                            <div className="flex flex-wrap gap-1">
                              {alert.affectedPlatforms.map((platform, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {platform}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {alert.recommendedActions && alert.recommendedActions.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-1">Recommended Actions:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {alert.recommendedActions.map((action, index) => (
                                <li key={index}>• {action}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">
                            {formatTimestamp(alert.timestamp)}
                          </p>
                          {!alert.read && (
                            <span className="text-xs text-blue-500">Click to mark as read</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      )}
    </Card>
  );
}