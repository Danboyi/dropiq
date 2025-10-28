'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Star, ExternalLink, TrendingUp } from 'lucide-react'
import { useFeaturedAirdrops } from '@/hooks/useFeaturedAirdrops'
import { Skeleton } from '@/components/ui/skeleton'

export function FeaturedAirdrops() {
  const { data, isLoading, error } = useFeaturedAirdrops()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Featured Opportunities
          </CardTitle>
          <CardDescription>
            Sponsored airdrops from trusted projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-border">
                <CardHeader className="pb-3">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !data?.campaigns.length) {
    return null // Don't show anything if there are no featured airdrops
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'standard':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'basic':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return '👑';
      case 'standard':
        return '⭐';
      case 'basic':
        return '🚀';
      default:
        return '🚀';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Featured Opportunities
        </CardTitle>
        <CardDescription>
          Sponsored airdrops from trusted projects
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.campaigns.map((campaign) => (
            <Card key={campaign.id} className="border border-border hover:border-primary transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${getTierBadgeColor(campaign.tier)}`}
                  >
                    {getTierIcon(campaign.tier)} SPONSORED
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {campaign.tier.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {campaign.airdrop.logoUrl && (
                    <img 
                      src={campaign.airdrop.logoUrl} 
                      alt={campaign.airdrop.name}
                      className="h-8 w-8 rounded-lg object-cover"
                    />
                  )}
                  <CardTitle className="text-lg">{campaign.airdrop.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="line-clamp-2 mb-4">
                  {campaign.airdrop.description}
                </CardDescription>
                
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="text-xs">
                    Risk: {campaign.airdrop.riskScore}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Hype: {campaign.airdrop.hypeScore}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3 inline mr-1" />
                    Featured until {new Date(campaign.endDate).toLocaleDateString()}
                  </div>
                  <Link href={`/airdrops/${campaign.airdrop.slug}`}>
                    <Button size="sm" variant="outline">
                      View
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {data.total > 6 && (
          <div className="text-center mt-6">
            <Link href="/featured">
              <Button variant="outline">
                View All Featured Airdrops
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}