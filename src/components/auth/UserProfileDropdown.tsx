'use client'

import { useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  User, 
  Settings, 
  LogOut, 
  Wallet, 
  Crown,
  Shield,
  ExternalLink,
  Link as LinkIcon
} from 'lucide-react'
import { useAuth } from '@/stores/authStore'
import Link from 'next/link'

export function UserProfileDropdown() {
  const { user, isConnected, connectedWallet, logout, isGuest } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) {
    return null
  }

  const getUserInitials = () => {
    if (user.name) {
      return user.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email?.slice(0, 2).toUpperCase() || 'U'
  }

  const getRoleIcon = () => {
    switch (user.role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />
      case 'user':
        return <Shield className="h-3 w-3 text-blue-500" />
      default:
        return <User className="h-3 w-3 text-gray-500" />
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatar} alt={user.name || user.email} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          {isConnected && (
            <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center space-x-2">
              <p className="text-sm font-medium leading-none">
                {user.name || 'Anonymous User'}
              </p>
              {getRoleIcon()}
            </div>
            {user.email && (
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            )}
            <div className="flex items-center space-x-2 mt-1">
              {isGuest && (
                <Badge variant="secondary" className="text-xs">
                  Guest Account
                </Badge>
              )}
              {isConnected && connectedWallet && (
                <Badge variant="outline" className="text-xs">
                  <Wallet className="h-3 w-3 mr-1" />
                  {formatAddress(connectedWallet)}
                </Badge>
              )}
            </div>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {isGuest && (
          <>
            <DropdownMenuItem asChild>
              <Link href="/auth/upgrade" className="flex items-center cursor-pointer">
                <Crown className="mr-2 h-4 w-4" />
                <span>Upgrade Account</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>

        {isConnected && connectedWallet && (
          <DropdownMenuItem asChild>
            <a 
              href={`https://etherscan.io/address/${connectedWallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center cursor-pointer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>View Wallet</span>
            </a>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={logout}
          className="text-red-600 focus:text-red-600 cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}