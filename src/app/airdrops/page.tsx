'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock,
  ExternalLink,
  Star,
  Shield,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function DashboardAirdrops() {
  const [loading, setLoading] = useState(true);
  const [airdrops, setAirdrops] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  useEffect(() => {
    // Simulate loading airdrops data
    const loadAirdrops = async () => {
      setLoading(true);
      
      // Mock data
      const mockAirdrops = [
        {
          id: 1,
          name: 'DeFiChain Airdrop',
          project: 'DeFiChain',
          description: 'Get free DFI tokens for early adopters',
          status: 'active',
          riskLevel: 'low',
          estimatedValue: 500,
          participants: 15420,
          deadline: '3 days',
          difficulty: 'Easy',
          requirements: ['Twitter', 'Discord', 'Wallet'],
          tags: ['DeFi', 'Yield Farming'],
          verified: true
        },
        {
          id: 2,
          name: 'NFT Marketplace Launch',
          project: 'NFTMarket',
          description: 'Limited edition NFTs for early users',
          status: 'active',
          riskLevel: 'medium',
          estimatedValue: 300,
          participants: 8750,
          deadline: '5 days',
          difficulty: 'Medium',
          requirements: ['Twitter', 'Telegram', 'ETH Wallet'],
          tags: ['NFT', 'Gaming'],
          verified: true
        },
        {
          id: 3,
          name: 'Layer 2 Testnet',
          project: 'L2Network',
          description: 'Test the new Layer 2 solution and earn rewards',
          status: 'upcoming',
          riskLevel: 'low',
          estimatedValue: 200,
          participants: 5230,
          deadline: '1 week',
          difficulty: 'Easy',
          requirements: ['Discord', 'Testnet Wallet'],
          tags: ['Layer 2', 'Testnet'],
          verified: true
        },
        {
          id: 4,
          name: 'Gaming Platform Rewards',
          project: 'GameFi',
          description: 'Play games and earn crypto rewards',
          status: 'active',
          riskLevel: 'medium',
          estimatedValue: 150,
          participants: 12000,
          deadline: '2 weeks',
          difficulty: 'Medium',
          requirements: ['Gaming Account', 'Wallet'],
          tags: ['Gaming', 'Play-to-Earn'],
          verified: false
        }
      ];

      setTimeout(() => {
        setAirdrops(mockAirdrops);
        setLoading(false);
      }, 1000);
    };

    loadAirdrops();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'Hard': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredAirdrops = airdrops.filter(airdrop => {
    const matchesSearch = airdrop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         airdrop.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || airdrop.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || airdrop.riskLevel === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Airdrops</h1>
          <p className="text-muted-foreground">
            Discover and participate in verified cryptocurrency airdrops
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Airdrops</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+2 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$2,847</div>
              <p className="text-xs text-muted-foreground">Available rewards</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45.2K</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">94.7%</div>
              <p className="text-xs text-muted-foreground">Completion rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search airdrops..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                </SelectContent>
              </Select>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Airdrops List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAirdrops.map((airdrop) => (
            <Card key={airdrop.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{airdrop.name}</CardTitle>
                      {airdrop.verified && (
                        <Shield className="h-4 w-4 text-blue-600" title="Verified" />
                      )}
                    </div>
                    <CardDescription>{airdrop.project}</CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className={getStatusColor(airdrop.status)}>
                      {airdrop.status}
                    </Badge>
                    <Badge className={getRiskColor(airdrop.riskLevel)}>
                      {airdrop.riskLevel}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {airdrop.description}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="font-medium">${airdrop.estimatedValue}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{airdrop.participants.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{airdrop.deadline}</span>
                    </div>
                    <div className={`font-medium ${getDifficultyColor(airdrop.difficulty)}`}>
                      {airdrop.difficulty}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {airdrop.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    <strong>Requirements:</strong> {airdrop.requirements.join(', ')}
                  </div>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <Button size="sm" className="flex-1">
                    Participate
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Star className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredAirdrops.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No airdrops found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}