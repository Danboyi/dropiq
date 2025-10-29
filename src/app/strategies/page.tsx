'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  Eye, 
  Heart, 
  MessageSquare, 
  Share2,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  Filter,
  Search,
  Plus,
  ChevronRight,
  Copy,
  FolderOpen
} from 'lucide-react';
import { useStrategies, useTrendingStrategies, useCopiedStrategies } from '@/hooks/useUserProfile';
import type { StrategyCategory, StrategyDifficulty, StrategyRiskLevel } from '@/types/user-profile';
import { StrategyCreationModal } from '@/components/strategies/StrategyCreationModal';

export default function StrategiesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StrategyCategory | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<StrategyDifficulty | 'all'>('all');
  const [selectedRisk, setSelectedRisk] = useState<StrategyRiskLevel | 'all'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { data: strategiesData, isLoading: isLoadingStrategies } = useStrategies({
    search: searchTerm || undefined,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
    difficulty: selectedDifficulty === 'all' ? undefined : selectedDifficulty,
    riskLevel: selectedRisk === 'all' ? undefined : selectedRisk,
    isPublic: true,
    limit: 20
  });
  
  const { data: trendingStrategies, isLoading: isLoadingTrending } = useTrendingStrategies(5);
  const { data: copiedStrategies, isLoading: isLoadingCopied } = useCopiedStrategies();

  const strategies = strategiesData?.strategies || [];
  const trending = trendingStrategies || [];
  const copied = copiedStrategies || [];

  const handleStrategyCreated = () => {
    // Refetch strategies or update local state
    window.location.reload();
  };

  const handleStrategyClick = (strategyId: string) => {
    router.push(`/strategies/${strategyId}`);
  };

  const getDifficultyColor = (difficulty: StrategyDifficulty) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-orange-100 text-orange-800';
      case 'expert':
        return 'bg-red-100 text-red-800';
    }
  };

  const getRiskColor = (risk: StrategyRiskLevel) => {
    switch (risk) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'extreme':
        return 'bg-red-100 text-red-800';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    } else if (minutes < 1440) {
      return `${Math.round(minutes / 60)}h`;
    } else {
      return `${Math.round(minutes / 1440)}d`;
    }
  };

  if (isLoadingStrategies || isLoadingTrending || isLoadingCopied) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Trading Strategies</h1>
          <p className="text-gray-600">
            Discover and share proven airdrop farming strategies
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Create Strategy
        </Button>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Strategies</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
          <TabsTrigger value="copied" className="flex items-center gap-2">
            <Copy className="w-4 h-4" />
            My Copies
            {copied.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {copied.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="created">Created</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {/* Trending Strategies */}
          {trending.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Trending Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {trending.map((strategy) => (
                    <div 
                      key={strategy.id} 
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleStrategyClick(strategy.id)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-xs">
                          {strategy.category}
                        </Badge>
                        {strategy.isVerified && (
                          <Badge variant="default" className="text-xs bg-green-500">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm mb-2 line-clamp-2">{strategy.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {strategy.metrics.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {strategy.metrics.likes}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search strategies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="defi">DeFi</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="nft">NFT</SelectItem>
                    <SelectItem value="layer1">Layer 1</SelectItem>
                    <SelectItem value="layer2">Layer 2</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                    <SelectItem value="testnet">Testnet</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                  </SelectContent>
                </Select>

                {/* Difficulty Filter */}
                <Select value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as any)}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>

                {/* Risk Filter */}
                <Select value={selectedRisk} onValueChange={(value) => setSelectedRisk(value as any)}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="extreme">Extreme</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  More Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {strategies.length} Strategies Found
            </h2>
            <Select defaultValue="newest">
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="success">Success Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Strategy Grid */}
          {strategies.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No strategies found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your filters or search terms to find what you're looking for.
                </p>
                <Button variant="outline">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {strategies.map((strategy) => (
                <Card 
                  key={strategy.id} 
                  className="hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleStrategyClick(strategy.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {strategy.category}
                        </Badge>
                        {strategy.isVerified && (
                          <Badge variant="default" className="text-xs bg-green-500">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">
                          {strategy.ratings.length > 0 
                            ? (strategy.ratings.reduce((sum, r) => sum + r.rating, 0) / strategy.ratings.length).toFixed(1)
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {strategy.title}
                    </CardTitle>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {strategy.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {/* Author */}
                    <div className="flex items-center gap-2 mb-4">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={strategy.author.avatar} alt={strategy.author.username} />
                        <AvatarFallback className="text-xs">
                          {strategy.author.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">{strategy.author.username}</span>
                      <span className="text-xs text-gray-500">• {strategy.author.reputation} RP</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      <Badge className={`text-xs ${getDifficultyColor(strategy.difficulty)}`}>
                        {strategy.difficulty}
                      </Badge>
                      <Badge className={`text-xs ${getRiskColor(strategy.riskLevel)}`}>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {strategy.riskLevel}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTime(strategy.estimatedTime)}
                      </Badge>
                    </div>

                    {/* Metrics */}
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {strategy.metrics.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {strategy.metrics.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {strategy.comments.length}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        {strategy.metrics.shares}
                      </span>
                    </div>

                    {/* Potential Reward */}
                    {strategy.potentialReward && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-green-800">Potential Reward</span>
                          <span className="text-sm font-bold text-green-600">
                            ${strategy.potentialReward.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Success Rate */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="text-sm font-medium text-green-600">
                        {strategy.metrics.successRate}%
                      </span>
                    </div>

                    {/* Action Button */}
                    <Button className="w-full group-hover:bg-blue-600 transition-colors">
                      View Strategy
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Trending Strategies
              </CardTitle>
              <p className="text-muted-foreground">
                Most popular strategies this week based on community engagement
              </p>
            </CardHeader>
            <CardContent>
              {trending.length === 0 ? (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No trending strategies</h3>
                  <p className="text-gray-600">
                    Check back later for trending strategies from the community.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trending.map((strategy) => (
                    <Card 
                      key={strategy.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer group"
                      onClick={() => handleStrategyClick(strategy.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {strategy.category}
                            </Badge>
                            {strategy.isVerified && (
                              <Badge variant="default" className="text-xs bg-green-500">
                                Verified
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">
                              {strategy.ratings.length > 0 
                                ? (strategy.ratings.reduce((sum, r) => sum + r.rating, 0) / strategy.ratings.length).toFixed(1)
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {strategy.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {strategy.description}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {strategy.metrics.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {strategy.metrics.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {strategy.comments.length}
                          </span>
                        </div>
                        <Button className="w-full group-hover:bg-blue-600 transition-colors">
                          View Strategy
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="copied" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5 text-blue-500" />
                My Copied Strategies
              </CardTitle>
              <p className="text-muted-foreground">
                Strategies you've personalized and copied from the community
              </p>
            </CardHeader>
            <CardContent>
              {copied.length === 0 ? (
                <div className="text-center py-12">
                  <Copy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No copied strategies yet</h3>
                  <p className="text-gray-600 mb-4">
                    Start copying and personalizing strategies from the community to see them here.
                  </p>
                  <Button onClick={() => setActiveTab('all')}>
                    Browse Strategies
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {copied.map((strategy) => (
                    <Card 
                      key={strategy.id} 
                      className="hover:shadow-lg transition-shadow cursor-pointer group border-blue-200"
                      onClick={() => handleStrategyClick(strategy.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {strategy.category}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                              <Copy className="w-3 h-3 mr-1" />
                              Copy
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">
                              {strategy.ratings.length > 0 
                                ? (strategy.ratings.reduce((sum, r) => sum + r.rating, 0) / strategy.ratings.length).toFixed(1)
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {strategy.title}
                        </CardTitle>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {strategy.description}
                        </p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2 mb-4">
                          <Badge className={`text-xs ${getDifficultyColor(strategy.difficulty)}`}>
                            {strategy.difficulty}
                          </Badge>
                          <Badge className={`text-xs ${getRiskColor(strategy.riskLevel)}`}>
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {strategy.riskLevel}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatTime(strategy.estimatedTime)}
                          </Badge>
                        </div>

                        {strategy.potentialReward && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-green-800">Potential Reward</span>
                              <span className="text-sm font-bold text-green-600">
                                ${strategy.potentialReward.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        )}

                        <Button className="w-full group-hover:bg-blue-600 transition-colors">
                          View Strategy
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="created" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-500" />
                My Created Strategies
              </CardTitle>
              <p className="text-muted-foreground">
                Strategies you've created and shared with the community
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Plus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No created strategies yet</h3>
                <p className="text-gray-600 mb-4">
                  Share your knowledge by creating your first airdrop farming strategy.
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  Create Strategy
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Strategy Creation Modal */}
      <StrategyCreationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleStrategyCreated}
      />
    </div>
  );
}