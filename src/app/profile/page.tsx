'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Star, 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  Award,
  Eye,
  Heart,
  MessageSquare,
  Share2
} from 'lucide-react';
import { useUserProfile, useUserStats, useUserProgress } from '@/hooks/useUserProfile';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Mock user ID - in real app, this would come from authentication
  const userId = 'user-123';
  
  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);
  const { data: stats, isLoading: statsLoading } = useUserStats(userId);
  const { data: progress, isLoading: progressLoading } = useUserProgress(userId);

  if (profileLoading || statsLoading || progressLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !stats || !progress) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile not found</h1>
          <p className="text-gray-600">The user profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Profile Header */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24">
              <AvatarImage src={profile.avatar} alt={profile.username} />
              <AvatarFallback className="text-2xl">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profile.username}</h1>
                  <p className="text-gray-600 mt-1">{profile.bio || 'No bio available'}</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    Level {profile.level}
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    {profile.reputation} RP
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {profile.followersCount} followers
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    Joined {new Date(profile.joinDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {stats.completedTasks}/{stats.totalTasks} tasks
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {stats.successRate}% success rate
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button variant="outline" size="sm">
                Edit Profile
              </Button>
              <Button variant="outline" size="sm">
                Share Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Experience Progress */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Experience Progress</h3>
            <span className="text-sm text-gray-600">
              {profile.experience} / {(profile.level * 100)} XP
            </span>
          </div>
          <Progress 
            value={(profile.experience / (profile.level * 100)) * 100} 
            className="h-2"
          />
          <p className="text-sm text-gray-600 mt-2">
            {((profile.level * 100) - profile.experience)} XP to next level
          </p>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="strategies">Strategies</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Performance Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tasks</span>
                  <span className="font-semibold">{stats.totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed</span>
                  <span className="font-semibold text-green-600">{stats.completedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold">{stats.successRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Earnings</span>
                  <span className="font-semibold text-green-600">${stats.totalEarnings}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Recent Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.achievements.slice(0, 3).map((achievement) => (
                    <div key={achievement.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                        <achievement.icon className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{achievement.name}</p>
                        <p className="text-xs text-gray-600">{achievement.points} points</p>
                      </div>
                    </div>
                  ))}
                  {profile.achievements.length === 0 && (
                    <p className="text-gray-500 text-sm">No achievements yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Strategies */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Recent Strategies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profile.recentStrategies.map((strategy) => (
                    <div key={strategy.id} className="border rounded-lg p-3">
                      <h4 className="font-medium text-sm mb-1">{strategy.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {strategy.metrics.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {strategy.metrics.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {strategy.comments.length}
                        </span>
                      </div>
                    </div>
                  ))}
                  {profile.recentStrategies.length === 0 && (
                    <p className="text-gray-500 text-sm">No strategies yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                All Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.achievements.map((achievement) => (
                  <div key={achievement.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <achievement.icon className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{achievement.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {achievement.category}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {achievement.points} points
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {profile.achievements.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No achievements unlocked yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="strategies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5" />
                My Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.recentStrategies.map((strategy) => (
                  <div key={strategy.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{strategy.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{strategy.description}</p>
                      </div>
                      <Badge variant="outline">{strategy.category}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {strategy.metrics.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {strategy.metrics.likes} likes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {strategy.comments.length} comments
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="w-4 h-4" />
                        {strategy.metrics.shares} shares
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{strategy.difficulty}</Badge>
                      <Badge variant="secondary">{strategy.estimatedTime}</Badge>
                      <Badge variant="secondary">{strategy.riskLevel}</Badge>
                    </div>
                  </div>
                ))}
                {profile.recentStrategies.length === 0 && (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No strategies created yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Current Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {progress.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                      <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{item.currentProgress}/{item.maxProgress}</span>
                      </div>
                      <Progress 
                        value={(item.currentProgress / item.maxProgress) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                      <span>Reward: ${item.estimatedReward}</span>
                      <span>Category: {item.category}</span>
                      {item.dueDate && (
                        <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                ))}
                {progress.length === 0 && (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No active tasks</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}