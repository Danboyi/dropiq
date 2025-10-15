'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { User, Wallet, Settings, LogOut, Crown } from 'lucide-react'
import { AuthModal } from './AuthModal'
import { WalletConnectModal } from './WalletConnectModal'

export function UserMenu() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  
  const { 
    user, 
    isAuthenticated, 
    isWalletConnected,
    isGuest,
    isUser,
    isPremium,
    isAdmin,
    logout,
    setShowAuthModal,
    setShowWalletModal
  } = useAuthStore()

  const handleLogout = async () => {
    try {
      // Call logout API
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    // Disconnect wallet if connected
    if (isConnected) {
      disconnect()
    }
    
    // Clear local state
    logout()
    
    // Clear tokens
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
  }

  const getRoleIcon = () => {
    if (isAdmin) return <Crown className="h-4 w-4 text-yellow-500" />
    if (isPremium) return <Crown className="h-4 w-4 text-purple-500" />
    if (isUser) return <User className="h-4 w-4 text-blue-500" />
    return <User className="h-4 w-4 text-gray-500" />
  }

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin'
    if (isPremium) return 'Premium'
    if (isUser) return 'User'
    if (isGuest) return 'Guest'
    return 'Unknown'
  }

  if (!isAuthenticated && !isWalletConnected) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowAuthModal(true)}
          >
            Sign In
          </Button>
          <Button onClick={() => setShowWalletModal(true)}>
            Connect Wallet
          </Button>
        </div>
        <AuthModal />
        <WalletConnectModal />
      </>
    )
  }

  if (isAuthenticated || isWalletConnected) {
    const displayName = user?.firstName || user?.email || address?.slice(0, 6) + '...' || 'User'
    const avatarSrc = user?.avatar || undefined
    const avatarFallback = displayName.slice(0, 2).toUpperCase()

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={avatarSrc} alt={displayName} />
                <AvatarFallback>{avatarFallback}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || address}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getRoleIcon()}
                  <span className="text-xs text-muted-foreground">
                    {getRoleLabel()}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            {isGuest && (
              <DropdownMenuItem onClick={() => setShowAuthModal(true)}>
                <User className="mr-2 h-4 w-4" />
                <span>Upgrade Account</span>
              </DropdownMenuItem>
            )}
            
            {user && !isWalletConnected && (
              <DropdownMenuItem onClick={() => setShowWalletModal(true)}>
                <Wallet className="mr-2 h-4 w-4" />
                <span>Link Wallet</span>
              </DropdownMenuItem>
            )}
            
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <AuthModal />
        <WalletConnectModal />
      </>
    )
  }

  return null
}