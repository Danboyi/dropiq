'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MoreHorizontal,
  Star,
  ExternalLink,
  Filter,
  Search,
  Eye,
  Share2
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useSaveAirdrop, useUnsaveAirdrop } from '@/hooks/use-api';
import { toast } from 'sonner';

interface Airdrop {
  id: string;
  title: string;
  description: string;
  project: string;
  logo?: string;
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
  type: 'STANDARD' | 'NFT' | 'GOVERNANCE' | 'SOCIAL' | 'TESTNET';
  estimatedValue: number;
  actualValue?: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  requirements: string[];
  deadline?: string;
  participants: number;
  maxParticipants?: number;
  tags: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  scamProbability: number;
  createdAt: string;
  updatedAt: string;
}

interface AirdropsTableProps {
  data: Airdrop[];
  loading?: boolean;
  onViewDetails?: (airdrop: Airdrop) => void;
  onParticipate?: (airdrop: Airdrop) => void;
}

type SortField = 'title' | 'project' | 'estimatedValue' | 'participants' | 'deadline' | 'riskLevel';
type SortDirection = 'asc' | 'desc';
type FilterStatus = 'all' | 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';
type FilterType = 'all' | 'STANDARD' | 'NFT' | 'GOVERNANCE' | 'SOCIAL' | 'TESTNET';
type FilterRisk = 'all' | 'LOW' | 'MEDIUM' | 'HIGH';

export function AirdropsTable({ 
  data, 
  loading = false, 
  onViewDetails, 
  onParticipate 
}: AirdropsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterRisk, setFilterRisk] = useState<FilterRisk>('all');
  
  const { savedAirdrops, participatedAirdrops } = useAppStore();
  const saveAirdropMutation = useSaveAirdrop();
  const unsaveAirdropMutation = useUnsaveAirdrop();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSaveToggle = (airdrop: Airdrop, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSaved = savedAirdrops.includes(airdrop.id);
    
    if (isSaved) {
      unsaveAirdropMutation.mutate(airdrop.id);
    } else {
      saveAirdropMutation.mutate(airdrop.id);
    }
  };

  const filteredAndSortedData = data
    .filter((airdrop) => {
      const matchesSearch = searchTerm === '' || 
        airdrop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        airdrop.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        airdrop.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || airdrop.status === filterStatus;
      const matchesType = filterType === 'all' || airdrop.type === filterType;
      const matchesRisk = filterRisk === 'all' || airdrop.riskLevel === filterRisk;

      return matchesSearch && matchesStatus && matchesType && matchesRisk;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'deadline') {
        aValue = a.deadline ? new Date(a.deadline).getTime() : 0;
        bValue = b.deadline ? new Date(b.deadline).getTime() : 0;
      } else if (sortField === 'createdAt') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'default';
      case 'UPCOMING': return 'secondary';
      case 'ENDED': return 'outline';
      case 'CANCELLED': return 'destructive';
      default: return 'outline';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return 'default';
      case 'MEDIUM': return 'secondary';
      case 'HIGH': return 'destructive';
      default: return 'outline';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'default';
      case 'MEDIUM': return 'secondary';
      case 'HARD': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDeadline = (deadline?: string) => {
    if (!deadline) return 'No deadline';
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days <= 7) return `${days} days`;
    return date.toLocaleDateString();
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-10 bg-muted rounded w-64 animate-pulse" />
          <div className="h-10 bg-muted rounded w-32 animate-pulse" />
          <div className="h-10 bg-muted rounded w-32 animate-pulse" />
        </div>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Airdrop</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Participants</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 bg-muted rounded w-48 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-16 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-20 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-24 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-16 animate-pulse" /></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-20 animate-pulse" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search airdrops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={filterStatus} onValueChange={(value: FilterStatus) => setFilterStatus(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="UPCOMING">Upcoming</SelectItem>
            <SelectItem value="ENDED">Ended</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={(value: FilterType) => setFilterType(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="STANDARD">Standard</SelectItem>
            <SelectItem value="NFT">NFT</SelectItem>
            <SelectItem value="GOVERNANCE">Governance</SelectItem>
            <SelectItem value="SOCIAL">Social</SelectItem>
            <SelectItem value="TESTNET">Testnet</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterRisk} onValueChange={(value: FilterRisk) => setFilterRisk(value)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Risk Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Risks</SelectItem>
            <SelectItem value="LOW">Low Risk</SelectItem>
            <SelectItem value="MEDIUM">Medium Risk</SelectItem>
            <SelectItem value="HIGH">High Risk</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredAndSortedData.length} of {data.length} airdrops
        </p>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {searchTerm || filterStatus !== 'all' || filterType !== 'all' || filterRisk !== 'all' 
              ? 'Filters applied' 
              : 'No filters'
            }
          </span>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('title')}
              >
                <div className="flex items-center gap-2">
                  Airdrop
                  <SortIcon field="title" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('estimatedValue')}
              >
                <div className="flex items-center gap-2">
                  Est. Value
                  <SortIcon field="estimatedValue" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('participants')}
              >
                <div className="flex items-center gap-2">
                  Participants
                  <SortIcon field="participants" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('deadline')}
              >
                <div className="flex items-center gap-2">
                  Deadline
                  <SortIcon field="deadline" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('riskLevel')}
              >
                <div className="flex items-center gap-2">
                  Risk
                  <SortIcon field="riskLevel" />
                </div>
              </TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-muted-foreground">No airdrops found</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your filters or search terms
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedData.map((airdrop) => (
                <TableRow 
                  key={airdrop.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onViewDetails?.(airdrop)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={airdrop.logo} alt={airdrop.project} />
                        <AvatarFallback>
                          {airdrop.project.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{airdrop.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{airdrop.project}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">${airdrop.estimatedValue}</p>
                      <div className="flex gap-1">
                        <Badge variant={getDifficultyColor(airdrop.difficulty)} className="text-xs">
                          {airdrop.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {airdrop.type}
                        </Badge>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">{airdrop.participants.toLocaleString()}</p>
                      {airdrop.maxParticipants && (
                        <p className="text-xs text-muted-foreground">
                          of {airdrop.maxParticipants.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm">{formatDeadline(airdrop.deadline)}</p>
                      <Badge variant={getStatusColor(airdrop.status)} className="text-xs">
                        {airdrop.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant={getRiskColor(airdrop.riskLevel)} className="text-xs">
                        {airdrop.riskLevel}
                      </Badge>
                      {airdrop.scamProbability > 0.3 && (
                        <p className="text-xs text-orange-600">
                          {Math.round(airdrop.scamProbability * 100)}% risk
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => onViewDetails?.(airdrop)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleSaveToggle(airdrop, e)}>
                          <Star className={`w-4 h-4 mr-2 ${savedAirdrops.includes(airdrop.id) ? 'fill-current text-yellow-500' : ''}`} />
                          {savedAirdrops.includes(airdrop.id) ? 'Unsave' : 'Save'}
                        </DropdownMenuItem>
                        {airdrop.status === 'ACTIVE' && (
                          <DropdownMenuItem onClick={() => onParticipate?.(airdrop)}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Participate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Share2 className="w-4 h-4 mr-2" />
                          Share
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}