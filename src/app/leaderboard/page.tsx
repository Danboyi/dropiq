'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  TrendingUp, 
  DollarSign, 
  Award,
  Medal,
  Crown,
  Star,
  Users,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { useLeaderboard } from '@/hooks/useUserProfile';

type LeaderboardType = 'reputation' | 'earnings' | 'achievements';

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState<LeaderboardType>('reputation');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  
  const { data: leaderboard, isLoading } = useLeaderboard(activeTab, 20);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <ArrowUp className="w-4 h-4 text-green-500" />;
    } else if (change < 0) {
      return <ArrowDown className="w-4 h-4 text-red-500" />;
    } else {
      return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTabIcon = (type: LeaderboardType) => {
    switch (type) {
      case 'reputation':
        return <Trophy className="w-4 h-4" />;
      case 'earnings':
        return <DollarSign className="w-4 h-4" />;
      case 'achievements':
        return <Award className="w-4 h-4" />;
    }
  };

  const getTabLabel = (type: LeaderboardType) => {
    switch (type) {
      case 'reputation':
        return 'Reputation';
      case 'earnings':
        return 'Earnings';
      case 'achievements':
        return 'Achievements';
    }
  };

  const getValueLabel = (type: LeaderboardType, value: number) => {
    switch (type) {
      case 'reputation':
        return `${value} RP`;
      case 'earnings':
        return `$${value.toLocaleString()}`;
      case 'achievements':
        return `${value} badges`;
    }
  };

  const getValueColor = (type: LeaderboardType) => {
    switch (type) {
      case 'reputation':
        return 'text-purple-600';
      case 'earnings':
        return 'text-green-600';
      case 'achievements':
        return 'text-blue-600';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
          <Trophy className="w-8 h-8 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-lg text-gray-600">
          Top performers in the DROPIQ community
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-center mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-1 inline-flex">
          {(['week', 'month', 'all'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="capitalize"
            >
              {range === 'all' ? 'All Time' : `This ${range}`}
            </Button>
          ))}
        </div>
      </div>

      {/* Leaderboard Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as LeaderboardType)}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          {(['reputation', 'earnings', 'achievements'] as LeaderboardType[]).map((type) => (
            <TabsTrigger key={type} value={type} className="flex items-center gap-2">
              {getTabIcon(type)}
              {getTabLabel(type)}
            </TabsTrigger>
          ))}
        </TabsList>

        {(['reputation', 'earnings', 'achievements'] as LeaderboardType[]).map((type) => (
          <TabsContent key={type} value={type} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getTabIcon(type)}
                  {getTabLabel(type)} Rankings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!leaderboard || leaderboard.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No data available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry) => (
                      <div
                        key={entry.user.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent border-yellow-200' : 'bg-white'
                        }`}
                      >
                        {/* Rank */}
                        <div className="flex items-center justify-center w-12">
                          {getRankIcon(entry.rank)}
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-3 flex-1">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={entry.user.avatar} alt={entry.user.username} />
                            <AvatarFallback>
                              {entry.user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{entry.user.username}</h3>
                              {entry.rank <= 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  Level {entry.user.level}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {entry.user.reputation} reputation points
                            </p>
                          </div>
                        </div>

                        {/* Value */}
                        <div className="text-right">
                          <div className={`font-bold text-lg ${getValueColor(type)}`}>
                            {getValueLabel(type, entry.value)}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            {getChangeIcon(entry.change)}
                            <span>
                              {entry.change === 0 ? 'No change' : 
                               entry.change > 0 ? `+${entry.change}` : entry.change}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card>
          <CardContent className="p-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Top Performer</h3>
            <p className="text-2xl font-bold text-gray-900">
              {leaderboard?.[0]?.user.username || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              {leaderboard?.[0] ? getValueLabel(activeTab, leaderboard[0].value) : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Total Participants</h3>
            <p className="text-2xl font-bold text-gray-900">
              {leaderboard?.length || 0}
            </p>
            <p className="text-sm text-gray-600">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Avg. Performance</h3>
            <p className="text-2xl font-bold text-gray-900">
              {leaderboard && leaderboard.length > 0 
                ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.value, 0) / leaderboard.length)
                : 0}
            </p>
            <p className="text-sm text-gray-600">
              {activeTab === 'reputation' ? 'Reputation points' :
               activeTab === 'earnings' ? 'USD earned' : 'Achievements'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}