'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, 
  Users, 
  DollarSign, 
  ExternalLink, 
  Star, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Shield,
  Calendar,
  Target,
  Zap
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useSaveAirdrop, useUnsaveAirdrop, useParticipateInAirdrop } from '@/hooks/use-api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AirdropCardProps {
  airdrop: {
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
  };
  showActions?: boolean;
  compact?: boolean;
}

export function AirdropCard({ airdrop, showActions = true, compact = false }: AirdropCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { savedAirdrops, participatedAirdrops, connectedWallet } = useAppStore();
  const saveAirdropMutation = useSaveAirdrop();
  const unsaveAirdropMutation = useUnsaveAirdrop();
  const participateMutation = useParticipateInAirdrop();

  const isSaved = savedAirdrops.includes(airdrop.id);
  const hasParticipated = participatedAirdrops.includes(airdrop.id);
  const isExpired = airdrop.deadline && new Date(airdrop.deadline) < new Date();

  const handleSaveToggle = () => {
    if (isSaved) {
      unsaveAirdropMutation.mutate(airdrop.id);
    } else {
      saveAirdropMutation.mutate(airdrop.id);
    }
  };

  const handleParticipate = () => {
    if (!connectedWallet) {
      toast.error('Please connect a wallet first');
      return;
    }

    if (hasParticipated) {
      toast.info('You have already participated in this airdrop');
      return;
    }

    participateMutation.mutate({
      airdropId: airdrop.id,
      walletAddress: connectedWallet.address,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'UPCOMING':
        return 'secondary';
      case 'ENDED':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'HARD':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'HIGH':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'Expired';
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return `${days} days`;
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={airdrop.logo} alt={airdrop.project} />
              <AvatarFallback>
                {airdrop.project.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{airdrop.title}</h3>
              <p className="text-sm text-muted-foreground truncate">{airdrop.project}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor(airdrop.status)}>
                {airdrop.status}
              </Badge>
              <Badge variant={getRiskColor(airdrop.riskLevel)}>
                {airdrop.riskLevel}
              </Badge>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span>${airdrop.estimatedValue}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span>{airdrop.participants}</span>
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={handleSaveToggle}>
                <Star className={`w-4 h-4 ${isSaved ? 'fill-current text-yellow-500' : ''}`} />
              </Button>
              <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{airdrop.title}</DialogTitle>
                    <DialogDescription>{airdrop.project}</DialogDescription>
                  </DialogHeader>
                  <AirdropDetails airdrop={airdrop} />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={airdrop.logo} alt={airdrop.project} />
              <AvatarFallback>
                {airdrop.project.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{airdrop.title}</CardTitle>
              <CardDescription>{airdrop.project}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant={getStatusColor(airdrop.status)}>
              {airdrop.status}
            </Badge>
            <Badge variant={getRiskColor(airdrop.riskLevel)}>
              {airdrop.riskLevel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {airdrop.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-4">
          {airdrop.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {airdrop.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{airdrop.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-sm font-medium">${airdrop.estimatedValue}</p>
              <p className="text-xs text-muted-foreground">Est. Value</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{airdrop.participants.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Participants</p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex items-center gap-4">
            <Badge variant={getDifficultyColor(airdrop.difficulty)}>
              {airdrop.difficulty}
            </Badge>
            <Badge variant="outline">{airdrop.type}</Badge>
          </div>
          {airdrop.deadline && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{formatDeadline(airdrop.deadline)}</span>
            </div>
          )}
        </div>

        {/* Risk Warning */}
        {airdrop.scamProbability > 0.3 && (
          <div className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-md mb-4">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <p className="text-xs text-orange-800 dark:text-orange-200">
              Risk Score: {Math.round(airdrop.scamProbability * 100)}%
            </p>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex-1">
                  View Details
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{airdrop.title}</DialogTitle>
                  <DialogDescription>{airdrop.project}</DialogDescription>
                </DialogHeader>
                <AirdropDetails airdrop={airdrop} />
              </DialogContent>
            </Dialog>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveToggle}
              disabled={saveAirdropMutation.isPending || unsaveAirdropMutation.isPending}
            >
              <Star className={`w-4 h-4 ${isSaved ? 'fill-current text-yellow-500' : ''}`} />
            </Button>

            {airdrop.status === 'ACTIVE' && !isExpired && (
              <Button
                className="flex-1"
                onClick={handleParticipate}
                disabled={hasParticipated || participateMutation.isPending}
              >
                {hasParticipated ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Participated
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Participate
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AirdropDetails({ airdrop }: { airdrop: AirdropCardProps['airdrop'] }) {
  return (
    <ScrollArea className="max-h-[60vh]">
      <div className="space-y-6">
        {/* Description */}
        <div>
          <h4 className="font-medium mb-2">Description</h4>
          <p className="text-sm text-muted-foreground">{airdrop.description}</p>
        </div>

        {/* Requirements */}
        <div>
          <h4 className="font-medium mb-2">Requirements</h4>
          <ul className="space-y-1">
            {airdrop.requirements.map((req, index) => (
              <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Estimated Value</span>
            </div>
            <p className="text-lg font-bold">${airdrop.estimatedValue}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Participants</span>
            </div>
            <p className="text-lg font-bold">{airdrop.participants.toLocaleString()}</p>
          </div>
        </div>

        {/* Risk Analysis */}
        <div>
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Risk Analysis
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Risk Level</span>
              <Badge variant={airdrop.riskLevel === 'LOW' ? 'default' : airdrop.riskLevel === 'MEDIUM' ? 'secondary' : 'destructive'}>
                {airdrop.riskLevel}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span>Scam Probability</span>
              <span>{Math.round(airdrop.scamProbability * 100)}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Difficulty</span>
              <Badge variant={airdrop.difficulty === 'EASY' ? 'default' : airdrop.difficulty === 'MEDIUM' ? 'secondary' : 'destructive'}>
                {airdrop.difficulty}
              </Badge>
            </div>
          </div>
        </div>

        {/* Timeline */}
        {airdrop.deadline && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeline
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Created</span>
                <span>{new Date(airdrop.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Deadline</span>
                <span>{new Date(airdrop.deadline).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}