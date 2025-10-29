'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  Flag,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react';
import type { StrategyRating as StrategyRatingType } from '@/types/user-profile';

interface StrategyRatingProps {
  strategyId: string;
  ratings: StrategyRatingType[];
  userRating?: StrategyRatingType;
  onRatingSubmit: (rating: number, review: string) => void;
  onRatingHelpful: (ratingId: string) => void;
}

export function StrategyRating({ 
  strategyId, 
  ratings, 
  userRating, 
  onRatingSubmit, 
  onRatingHelpful 
}: StrategyRatingProps) {
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const averageRating = ratings.length > 0 
    ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: ratings.filter(r => r.rating === rating).length,
    percentage: ratings.length > 0 ? (ratings.filter(r => r.rating === rating).length / ratings.length) * 100 : 0
  }));

  const handleSubmitRating = async () => {
    if (selectedRating === 0) return;
    
    setIsSubmitting(true);
    try {
      await onRatingSubmit(selectedRating, review);
      setSelectedRating(0);
      setReview('');
      setShowReviewForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Community Ratings & Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">{averageRating.toFixed(1)}</div>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= Math.round(averageRating) 
                        ? 'text-yellow-500 fill-current' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                {ratings.length} {ratings.length === 1 ? 'review' : 'reviews'}
              </div>
              
              {/* Rating Distribution */}
              <div className="space-y-2">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm w-3">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Community Stats */}
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-medium mb-3">Community Success</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {ratings.length > 0 
                        ? Math.round(ratings.filter(r => r.rating >= 4).length / ratings.length * 100)
                        : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {ratings.length > 0 
                        ? Math.round(ratings.reduce((sum, r) => sum + (r.successRate || 0), 0) / ratings.length)
                        : 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Success</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  disabled={!!userRating}
                  className="w-full"
                >
                  {userRating ? 'You have already reviewed this strategy' : 'Write a Review'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {showReviewForm && !userRating && (
        <Card>
          <CardHeader>
            <CardTitle>Share Your Experience</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Rating</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setSelectedRating(rating)}
                    className="p-1"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        rating <= selectedRating 
                          ? 'text-yellow-500 fill-current' 
                          : 'text-gray-300 hover:text-yellow-400'
                      } transition-colors`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="review">Your Review</Label>
              <Textarea
                id="review"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience with this strategy. Did it work for you? What were the results?"
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSubmitRating}
                disabled={selectedRating === 0 || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowReviewForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Reviews */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Community Reviews</h3>
        
        {ratings.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium mb-2">No reviews yet</h4>
              <p className="text-muted-foreground">
                Be the first to share your experience with this strategy.
              </p>
            </CardContent>
          </Card>
        ) : (
          ratings.map((rating) => (
            <Card key={rating.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={rating.user.avatar} alt={rating.user.username} />
                    <AvatarFallback>
                      {rating.user.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{rating.user.username}</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating.rating 
                                ? 'text-yellow-500 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(rating.createdAt)}
                      </span>
                    </div>

                    {rating.successRate && (
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className={`text-sm font-medium ${getSuccessRateColor(rating.successRate)}`}>
                          {rating.successRate}% success rate
                        </span>
                      </div>
                    )}

                    {rating.comment && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {rating.comment}
                      </p>
                    )}

                    <div className="flex items-center gap-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onRatingHelpful(rating.id)}
                        className="flex items-center gap-1"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        Helpful ({rating.helpful || 0})
                      </Button>
                      
                      {rating.user.isVerified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified User
                        </Badge>
                      )}
                      
                      {rating.isPurchased && (
                        <Badge variant="outline" className="text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Applied Strategy
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}