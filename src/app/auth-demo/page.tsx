'use client'

import { useState } from 'react'
import { ConnectWalletButton } from '@/components/auth/ConnectWalletButton'
import { AuthModal } from '@/components/auth/AuthModal'
import { UserProfileDropdown } from '@/components/auth/UserProfileDropdown'
import { LinkAccountPrompt } from '@/components/auth/LinkAccountPrompt'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/stores/authStore'
import { 
  User, 
  Wallet, 
  Shield, 
  Crown, 
  CheckCircle, 
  AlertCircle,
  Settings,
  LogOut
} from 'lucide-react'

export default function AuthDemoPage() {
  const { 
    user, 
    isAuthenticated, 
    isGuest, 
    isConnected, 
    connectedWallet,
    login, 
    register, 
    logout,
    connectWallet,
    disconnectWallet 
  } = useAuth()

  const [showAuthModal, setShowAuthModal] = useState(false)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">Authentication System Demo</h1>
          <p className="text-xl text-muted-foreground">
            Complete hybrid authentication with wallet connection and email/password
          </p>
        </div>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </div>
                <Badge variant={isAuthenticated ? 'default' : 'secondary'}>
                  {isAuthenticated ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                  Session Status
                </Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">
                  {isGuest ? 'Guest' : 'Registered'}
                </div>
                <Badge variant={isGuest ? 'secondary' : 'default'}>
                  {isGuest ? <User className="h-3 w-3 mr-1" /> : <Crown className="h-3 w-3 mr-1" />}
                  Account Type
                </Badge>
              </div>
              
              <div className="text-center p-4 border rounded-lg">
                <div className="text-2xl font-bold mb-2">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
                <Badge variant={isConnected ? 'default' : 'secondary'}>
                  {isConnected ? <Wallet className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                  Wallet Status
                </Badge>
              </div>
            </div>

            {user && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">User Information:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div><strong>ID:</strong> {user.id}</div>
                  <div><strong>Email:</strong> {user.email || 'Not provided'}</div>
                  <div><strong>Name:</strong> {user.name || 'Not provided'}</div>
                  <div><strong>Role:</strong> {user.role}</div>
                  <div><strong>Guest:</strong> {user.isGuest ? 'Yes' : 'No'}</div>
                  <div><strong>Wallets:</strong> {user.wallets?.length || 0} connected</div>
                </div>
                {connectedWallet && (
                  <div className="mt-2">
                    <strong>Current Wallet:</strong> {connectedWallet}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Authentication Components */}
        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="wallet">Wallet Connection</TabsTrigger>
            <TabsTrigger value="auth">Email/Password Auth</TabsTrigger>
            <TabsTrigger value="profile">User Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="wallet" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Connection</CardTitle>
                <CardDescription>
                  Connect your wallet for instant access as a guest user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConnectWalletButton />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email/Password Authentication</CardTitle>
                <CardDescription>
                  Create a permanent account or login with existing credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Button onClick={() => setShowAuthModal(true)}>
                    <User className="h-4 w-4 mr-2" />
                    Open Auth Modal
                  </Button>
                  
                  {user && (
                    <Button variant="outline" onClick={logout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  )}
                </div>
                
                <AuthModal 
                  isOpen={showAuthModal} 
                  onClose={() => setShowAuthModal(false)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Profile Dropdown</CardTitle>
                <CardDescription>
                  Profile management with user dropdown menu
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Click the avatar to see profile options
                      </p>
                    </div>
                    <UserProfileDropdown />
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Please authenticate to see the profile dropdown
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Link Account Prompt */}
        <LinkAccountPrompt />

        {/* Feature Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Features</CardTitle>
            <CardDescription>
              Complete hybrid authentication system capabilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold">🔐 Security Features</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• JWT-based stateless authentication</li>
                  <li>• Bcrypt password hashing</li>
                  <li>• Wallet signature verification</li>
                  <li>• Role-based access control</li>
                  <li>• Automatic token refresh</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">🚀 User Experience</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Instant wallet access (guest mode)</li>
                  <li>• Seamless account upgrading</li>
                  <li>• Multi-wallet support</li>
                  <li>• Persistent sessions</li>
                  <li>• Read-only wallet connection</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}