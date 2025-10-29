'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Share2, 
  Heart, 
  MessageSquare, 
  Bookmark,
  Star,
  Clock,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Users,
  Copy,
  ExternalLink,
  Calendar,
  TrendingUp,
  Shield,
  Zap,
  Eye
} from 'lucide-react';
import { StrategyRating } from './StrategyRating';
import { StrategyCopyModal } from './StrategyCopyModal';
import type { Strategy, StrategyCategory, StrategyDifficulty, StrategyRiskLevel } from '@/types/user-profile';

interface StrategyDetailViewProps {
  strategy: Strategy;
}

export function StrategyDetailView({ strategy }: StrategyDetailViewProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

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
      return `${minutes} minutes`;
    } else if (minutes < 1440) {
      return `${Math.round(minutes / 60)} hours`;
    } else {
      return `${Math.round(minutes / 1440)} days`;
    }
  };

  const handleCopyStrategy = async () => {
    setIsCopyModalOpen(true);
  };

  const handleCopyComplete = (copiedStrategy: Strategy) => {
    // Show success message or redirect to the copied strategy
    router.push(`/strategies/${copiedStrategy.id}`);
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/strategies/${strategy.id}/like`, {
        method: 'POST',
      });
      if (response.ok) {
        setIsLiked(!isLiked);
      }
    } catch (error) {
      console.error('Failed to like strategy:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      const response = await fetch(`/api/strategies/${strategy.id}/bookmark`, {
        method: 'POST',
      });
      if (response.ok) {
        setIsBookmarked(!isBookmarked);
      }
    } catch (error) {
      console.error('Failed to bookmark strategy:', error);
    }
  };

  const handleRatingSubmit = async (rating: number, review: string) => {
    try {
      const response = await fetch(`/api/strategies/${strategy.id}/rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating, comment: review }),
      });
      if (response.ok) {
        // Refresh strategy data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  const handleRatingHelpful = async (ratingId: string) => {
    try {
      await fetch(`/api/strategies/${strategy.id}/ratings/${ratingId}/helpful`, {
        method: 'POST',
      });
    } catch (error) {
      console.error('Failed to mark rating as helpful:', error);
    }
  };

  const steps = strategy.content.split('\n\n').filter(step => step.trim());

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => router.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Strategies
        </Button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">{strategy.category}</Badge>
              {strategy.isVerified && (
                <Badge className="bg-green-500">
                  <Shield className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              <Badge className={getDifficultyColor(strategy.difficulty)}>
                {strategy.difficulty}
              </Badge>
              <Badge className={getRiskColor(strategy.riskLevel)}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {strategy.riskLevel}
              </Badge>
            </div>

            <h1 className="text-3xl font-bold mb-4">{strategy.title}</h1>
            <p className="text-lg text-muted-foreground mb-6">{strategy.description}</p>

            <div className="flex items-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={strategy.author.avatar} alt={strategy.author.username} />
                  <AvatarFallback>
                    {strategy.author.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{strategy.author.username}</p>
                  <p className="text-sm text-muted-foreground">{strategy.author.reputation} RP</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                {new Date(strategy.createdAt).toLocaleDateString()}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                <span className="font-medium">
                  {strategy.ratings.length > 0 
                    ? (strategy.ratings.reduce((sum, r) => sum + r.rating, 0) / strategy.ratings.length).toFixed(1)
                    : 'N/A'}
                </span>
                <span className="text-muted-foreground">({strategy.ratings.length} reviews)</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                <span>{strategy.metrics.views} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>{strategy.metrics.likes} likes</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>{strategy.comments.length} comments</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {strategy.tags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>

          <div className="lg:w-80">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Strategy Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time Required
                  </span>
                  <span className="font-medium">{formatTime(strategy.estimatedTime)}</span>
                </div>
                
                {strategy.potentialReward && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Potential Reward
                    </span>
                    <span className="font-medium text-green-600">
                      ${strategy.potentialReward.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Success Rate
                  </span>
                  <span className="font-medium text-green-600">
                    {strategy.metrics.successRate}%
                  </span>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    onClick={handleLike}
                    variant={isLiked ? "default" : "outline"}
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    {isLiked ? 'Liked' : 'Like'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleBookmark}
                    className={isBookmarked ? 'bg-blue-50 border-blue-200' : ''}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current text-blue-600' : ''}`} />
                  </Button>
                  <Button variant="outline" onClick={handleCopyStrategy}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                <Button className="w-full" onClick={handleCopyStrategy}>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy & Personalize
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="steps">Step-by-Step</TabsTrigger>
          <TabsTrigger value="requirements">Requirements</TabsTrigger>
          <TabsTrigger value="tips">Tips & Tricks</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategy Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {strategy.content.split('\n\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">{paragraph}</p>
                ))}
              </div>
            </CardContent>
          </Card>

          {strategy.requirements && strategy.requirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {strategy.requirements.map((req, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="steps" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Step-by-Step Guide
              </CardTitle>
              <p className="text-muted-foreground">
                Follow these steps exactly as outlined for best results
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {steps.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm leading-relaxed">{step}</p>
                        </div>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="absolute left-4 top-8 w-0.5 h-6 bg-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requirements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                What You'll Need
              </CardTitle>
              <p className="text-muted-foreground">
                Make sure you have everything before starting this strategy
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {strategy.requirements?.map((req, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tips" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" />
                Pro Tips & Tricks
              </CardTitle>
              <p className="text-muted-foreground">
                Insider knowledge to maximize your success
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {strategy.tips?.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <p className="text-sm">{tip}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="space-y-6">
          <StrategyRating
            strategyId={strategy.id}
            ratings={strategy.ratings}
            onRatingSubmit={handleRatingSubmit}
            onRatingHelpful={handleRatingHelpful}
          />
        </TabsContent>
      </Tabs>

      {/* Strategy Copy Modal */}
      <StrategyCopyModal
        strategy={strategy}
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        onCopyComplete={handleCopyComplete}
      />
    </div>
  );
}