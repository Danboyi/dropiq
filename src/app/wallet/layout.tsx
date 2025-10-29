"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useSession, signOut } from "next-auth/react"
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
  LogOut,
  CheckCircle
} from "lucide-react"

const navigation = [
  { name: "Discover Airdrops", href: "/home", icon: Search },
  { name: "My Progress", href: "/progress", icon: CheckCircle },
  { name: "My Wallet", href: "/wallet", icon: Wallet },
  { name: "Security Alerts", href: "/security", icon: Shield },
  { name: "Analytics", href: "/analytics", icon: TrendingUp },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
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

          {/* User Section */}
          <div className="border-t border-border p-4">
            {session?.user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-lg bg-surface-hover p-3">
                  <Avatar className="size-8">
                    <AvatarImage src="/avatars/wallet.png" />
                    <AvatarFallback>
                      {session.user.name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary truncate">
                      {session.user.name || 'Anonymous User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.user.email || 'Connected'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Active
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg bg-surface-hover p-3">
                <Avatar className="size-8">
                  <AvatarFallback>W</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">
                    Not Connected
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Sign in to continue
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  Offline
                </Badge>
              </div>
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
              <Wallet className="size-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">/</span>
              <span className="text-sm font-medium">Wallet</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="size-4" />
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="size-4" />
              </Button>
            </Link>
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