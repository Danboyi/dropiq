'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Shield, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Send,
  Globe,
  FileText,
  Database,
  Bell,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BlacklistEntry {
  id: string;
  type: 'domain' | 'contract_address';
  value: string;
  source: string;
  createdAt: string;
}

interface SecurityAlert {
  type: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  affectedPlatforms?: string[];
  recommendedActions?: string[];
}

export default function AdminSecurityPage() {
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingThreats, setUpdatingThreats] = useState(false);
  const [broadcastingAlert, setBroadcastingAlert] = useState(false);
  
  // Blacklist form state
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'domain' | 'contract_address'>('domain');
  const [newEntryValue, setNewEntryValue] = useState('');
  const [newEntrySource, setNewEntrySource] = useState('admin_manual');
  
  // Alert form state
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [newAlert, setNewAlert] = useState<SecurityAlert>({
    type: 'medium',
    title: '',
    message: '',
    affectedPlatforms: [],
    recommendedActions: []
  });

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/blacklist');
      if (!response.ok) throw new Error('Failed to fetch blacklist');
      
      const data = await response.json();
      setBlacklist(data.entries);
    } catch (error) {
      console.error('Error fetching blacklist:', error);
      toast.error('Failed to fetch blacklist');
    } finally {
      setLoading(false);
    }
  };

  const updateThreatIntelligence = async () => {
    setUpdatingThreats(true);
    try {
      const response = await fetch('/api/admin/threat-intelligence/update', {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to update threat intelligence');
      
      const data = await response.json();
      toast.success(data.message);
      fetchBlacklist(); // Refresh the blacklist
    } catch (error) {
      console.error('Error updating threat intelligence:', error);
      toast.error('Failed to update threat intelligence');
    } finally {
      setUpdatingThreats(false);
    }
  };

  const addBlacklistEntry = async () => {
    if (!newEntryValue.trim()) {
      toast.error('Please enter a value');
      return;
    }

    try {
      const response = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: newEntryType,
          value: newEntryValue.trim(),
          source: newEntrySource
        }),
      });
      
      if (!response.ok) throw new Error('Failed to add blacklist entry');
      
      toast.success('Blacklist entry added successfully');
      setNewEntryValue('');
      setShowAddDialog(false);
      fetchBlacklist();
    } catch (error) {
      console.error('Error adding blacklist entry:', error);
      toast.error('Failed to add blacklist entry');
    }
  };

  const removeBlacklistEntry = async (id: string) => {
    if (!confirm('Are you sure you want to remove this blacklist entry?')) return;

    try {
      const response = await fetch(`/api/admin/blacklist/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to remove blacklist entry');
      
      toast.success('Blacklist entry removed successfully');
      fetchBlacklist();
    } catch (error) {
      console.error('Error removing blacklist entry:', error);
      toast.error('Failed to remove blacklist entry');
    }
  };

  const broadcastSecurityAlert = async () => {
    if (!newAlert.title.trim() || !newAlert.message.trim()) {
      toast.error('Please fill in title and message');
      return;
    }

    setBroadcastingAlert(true);
    try {
      const response = await fetch('/api/admin/broadcast-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert),
      });
      
      if (!response.ok) throw new Error('Failed to broadcast alert');
      
      toast.success('Security alert broadcasted successfully');
      setNewAlert({
        type: 'medium',
        title: '',
        message: '',
        affectedPlatforms: [],
        recommendedActions: []
      });
      setShowAlertDialog(false);
    } catch (error) {
      console.error('Error broadcasting alert:', error);
      toast.error('Failed to broadcast alert');
    } finally {
      setBroadcastingAlert(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'domain': return <Globe className="h-4 w-4" />;
      case 'contract_address': return <FileText className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getSourceBadge = (source: string) => {
    const colors: Record<string, string> = {
      'admin_manual': 'bg-blue-500',
      'goplus': 'bg-green-500',
      'chainabuse': 'bg-orange-500',
      'github_threat_intelligence': 'bg-purple-500'
    };
    return colors[source] || 'bg-gray-500';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Security Management</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Security Management</h1>
            <p className="text-muted-foreground">
              Manage blacklist entries and broadcast security alerts
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={updateThreatIntelligence}
            disabled={updatingThreats}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${updatingThreats ? 'animate-spin' : ''}`} />
            Update Threat Intelligence
          </Button>
          <Dialog open={showAlertDialog} onOpenChange={setShowAlertDialog}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Broadcast Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Broadcast Security Alert</DialogTitle>
                <DialogDescription>
                  Send a real-time security alert to all connected users
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="alert-type">Alert Type</Label>
                  <Select value={newAlert.type} onValueChange={(value: any) => setNewAlert(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="alert-title">Title</Label>
                  <Input
                    id="alert-title"
                    value={newAlert.title}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter alert title"
                  />
                </div>
                <div>
                  <Label htmlFor="alert-message">Message</Label>
                  <Textarea
                    id="alert-message"
                    value={newAlert.message}
                    onChange={(e) => setNewAlert(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Enter detailed alert message"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="affected-platforms">Affected Platforms (optional)</Label>
                  <Input
                    id="affected-platforms"
                    value={newAlert.affectedPlatforms?.join(', ')}
                    onChange={(e) => setNewAlert(prev => ({ 
                      ...prev, 
                      affectedPlatforms: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }))}
                    placeholder="e.g., Uniswap, MetaMask, OpenSea"
                  />
                </div>
                <div>
                  <Label htmlFor="recommended-actions">Recommended Actions (optional)</Label>
                  <Textarea
                    id="recommended-actions"
                    value={newAlert.recommendedActions?.join('\n')}
                    onChange={(e) => setNewAlert(prev => ({ 
                      ...prev, 
                      recommendedActions: e.target.value.split('\n').map(s => s.trim()).filter(Boolean)
                    }))}
                    placeholder="Enter recommended actions (one per line)"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowAlertDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={broadcastSecurityAlert}
                    disabled={broadcastingAlert}
                  >
                    <Send className={`h-4 w-4 mr-2 ${broadcastingAlert ? 'animate-pulse' : ''}`} />
                    Broadcast Alert
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Blacklist Entries</p>
                <p className="text-2xl font-bold">{blacklist.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Domains</p>
                <p className="text-2xl font-bold">
                  {blacklist.filter(entry => entry.type === 'domain').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Contracts</p>
                <p className="text-2xl font-bold">
                  {blacklist.filter(entry => entry.type === 'contract_address').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Alert System</p>
                <p className="text-2xl font-bold">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blacklist Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Blacklist Management</CardTitle>
              <CardDescription>
                Manage domains and contract addresses that are blocked
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Blacklist Entry</DialogTitle>
                  <DialogDescription>
                    Add a new domain or contract address to the blacklist
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="entry-type">Type</Label>
                    <Select value={newEntryType} onValueChange={(value: any) => setNewEntryType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="domain">Domain</SelectItem>
                        <SelectItem value="contract_address">Contract Address</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="entry-value">
                      {newEntryType === 'domain' ? 'Domain' : 'Contract Address'}
                    </Label>
                    <Input
                      id="entry-value"
                      value={newEntryValue}
                      onChange={(e) => setNewEntryValue(e.target.value)}
                      placeholder={newEntryType === 'domain' ? 'example.com' : '0x...'}
                    />
                  </div>
                  <div>
                    <Label htmlFor="entry-source">Source</Label>
                    <Select value={newEntrySource} onValueChange={setNewEntrySource}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin_manual">Admin Manual</SelectItem>
                        <SelectItem value="goplus">GoPlus Labs</SelectItem>
                        <SelectItem value="chainabuse">ChainAbuse</SelectItem>
                        <SelectItem value="github_threat_intelligence">GitHub Threat Intelligence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={addBlacklistEntry}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Entry
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blacklist.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(entry.type)}
                      <Badge variant="outline" className="capitalize">
                        {entry.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {entry.value}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`${getSourceBadge(entry.source)} text-white`}
                    >
                      {entry.source.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeBlacklistEntry(entry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {blacklist.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-8 w-8 mx-auto mb-2" />
              <p>No blacklist entries found</p>
              <p className="text-sm">Add entries to start protecting users</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}