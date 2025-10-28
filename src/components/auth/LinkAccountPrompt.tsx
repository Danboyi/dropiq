'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Crown, 
  ArrowRight, 
  CheckCircle, 
  Info, 
  Shield,
  Zap,
  Database
} from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import { AuthModal } from './AuthModal'

export function LinkAccountPrompt() {
  const { user, isConnected, connectedWallet } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)

  // Only show for guest users with connected wallets
  if (!user || !user.isGuest || !isConnected || !connectedWallet) {
    return null
  }

  const benefits = [
    {
      icon: <Database className="h-4 w-4" />,
      title: "Save Your Progress",
      description: "Never lose your airdrop tracking data"
    },
    {
      icon: <Shield className="h-4 w-4" />,
      title: "Enhanced Security",
      description: "Email backup and account recovery"
    },
    {
      icon: <Zap className="h-4 w-4" />,
      title: "Premium Features",
      description: "Access advanced analytics and insights"
    },
    {
      icon: <Crown className="h-4 w-4" />,
      title: "Priority Support",
      description: "Get help when you need it most"
    }
  ]

  return (
    <>
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                <Info className="h-3 w-3 mr-1" />
                Guest Account
              </Badge>
              <CardTitle className="text-lg">Upgrade Your Experience</CardTitle>
            </div>
          </div>
          <CardDescription>
            You're connected as a guest user. Create a permanent account to save your progress and unlock premium features.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-white/50">
                <div className="flex-shrink-0 text-blue-600">
                  {benefit.icon}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{benefit.title}</h4>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Alert className="border-blue-200 bg-blue-100/50">
            <CheckCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Good news:</strong> Your wallet ({connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}) 
              will be automatically linked to your new account. No data will be lost!
            </AlertDescription>
          </Alert>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => setShowAuthModal(true)}
              className="flex-1"
            >
              <Crown className="h-4 w-4 mr-2" />
              Create Permanent Account
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => setShowAuthModal(true)}
            >
              Sign In Instead
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Takes less than 30 seconds • No credit card required • Your wallet stays connected
          </p>
        </CardContent>
      </Card>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        defaultTab="register"
      />
    </>
  )
}