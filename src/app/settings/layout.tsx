"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Home, 
  Search, 
  Wallet, 
  Shield, 
  Settings, 
  TrendingUp,
  Bell,
  Menu,
  X,
  Star,
  User,
  LogOut,
  Crown,
  CheckCircle
} from "lucide-react"
import { useAuth } from "@/stores/authStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const navigation = [
  { name: "Discover Airdrops", href: "/home", icon: Search },
  { name: "My Progress", href: "/progress", icon: CheckCircle },
  { name: "My Wallet", href: "/wallet", icon: Wallet },
  { name: "Security Alerts", href: "/security", icon: Shield },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, user, logout, hasWallet, connectedWallet } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[256px_1fr]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex lg:flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="size-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-primary">DROPIQ</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-surface-hover hover:text-primary"
                  )}
                >
                  <item.icon className="size-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Wallet Section */}
          <div className="border-t border-border p-4">
            {hasWallet ? (
              <div className="flex items-center gap-3 rounded-lg bg-surface-hover p-3">
                <Avatar className="size-8">
                  <AvatarImage src="/avatars/wallet.png" />
                  <AvatarFallback>W</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    {connectedWallet?.slice(0, 6)}...{connectedWallet?.slice(-4)}
                  </p>
                  <p className="text-xs text-muted-foreground">Connected</p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              </div>
            ) : (
              <Button variant="outline" className="w-full">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:col-start-2">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">/</span>
              <span className="text-sm font-medium">Settings</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Promote Airdrop */}
            <Link href="/promote">
              <Button className="hidden sm:flex">
                <Star className="h-4 w-4 mr-2" />
                Promote Airdrop
              </Button>
            </Link>

            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="size-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <Settings className="size-4" />
            </Button>

            {/* Wallet Connect */}
            {hasWallet ? (
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Wallet className="mr-2 h-4 w-4" />
                {connectedWallet?.slice(0, 6)}...{connectedWallet?.slice(-4)}
              </Button>
            ) : (
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}

            {/* User Dropdown */}
            {isAuthenticated && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      {user?.name && <p className="font-medium">{user.name}</p>}
                      {user?.email && (
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/'}>
                    <Search className="mr-2 h-4 w-4" />
                    Back to Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}