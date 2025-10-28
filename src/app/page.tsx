"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Shield, Search, Wallet, ArrowRight, Menu, X, User, LogOut, Bell, Settings, Crown } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/stores/authStore"
import { ConnectWalletButton } from "@/components/auth/ConnectWalletButton"
import { AuthModal } from "@/components/auth/AuthModal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  
  const { isAuthenticated, user, logout, hasWallet } = useAuth()

  const handleLogout = () => {
    logout()
  }

  const handleLaunchApp = () => {
    if (isAuthenticated) {
      window.location.href = '/home'
    } else {
      setIsAuthModalOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-surface">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="size-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">DROPIQ</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                How It Works
              </Link>
              <Link href="#security" className="text-muted-foreground hover:text-primary transition-colors">
                Security
              </Link>
            </nav>

            {/* Top Level User Actions */}
            <div className="hidden md:flex items-center gap-3">
              {/* Promote Airdrop */}
              <Button variant="outline" size="sm">
                <Crown className="mr-2 h-4 w-4" />
                Promote Airdrop
              </Button>

              {/* Auth State */}
              {isAuthenticated ? (
                <>
                  {/* Notification Bell */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
                  </Button>

                  {/* Settings */}
                  <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                  </Button>

                  {/* Wallet Connect */}
                  {hasWallet ? (
                    <Button variant="outline" size="sm">
                      <Wallet className="mr-2 h-4 w-4" />
                      Wallet Connected
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setIsAuthModalOpen(true)}>
                      <Wallet className="mr-2 h-4 w-4" />
                      Connect Wallet
                    </Button>
                  )}

                  {/* User Dropdown */}
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
                      <DropdownMenuItem onClick={handleLaunchApp}>
                        <Search className="mr-2 h-4 w-4" />
                        Launch App
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <Button onClick={handleLaunchApp}>
                  Launch App
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <nav className="flex flex-col gap-4">
                <Link href="#features" className="text-muted-foreground hover:text-primary transition-colors">
                  Features
                </Link>
                <Link href="#how-it-works" className="text-muted-foreground hover:text-primary transition-colors">
                  How It Works
                </Link>
                <Link href="#security" className="text-muted-foreground hover:text-primary transition-colors">
                  Security
                </Link>
                
                {/* Mobile User Actions */}
                {isAuthenticated ? (
                  <div className="space-y-3">
                    {/* Mobile Promote Airdrop */}
                    <Button variant="outline" className="w-full">
                      <Crown className="mr-2 h-4 w-4" />
                      Promote Airdrop
                    </Button>

                    {/* Mobile Notifications & Settings */}
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 relative">
                        <Bell className="mr-2 h-4 w-4" />
                        Notifications
                        <span className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Button>
                    </div>

                    {/* Mobile Wallet Connect */}
                    {hasWallet ? (
                      <Button variant="outline" className="w-full">
                        <Wallet className="mr-2 h-4 w-4" />
                        Wallet Connected
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" onClick={() => setIsAuthModalOpen(true)}>
                        <Wallet className="mr-2 h-4 w-4" />
                        Connect Wallet
                      </Button>
                    )}

                    {/* Mobile User Profile */}
                    <div className="flex items-center gap-3 p-3 bg-surface rounded-lg">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">{user?.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>
                    </div>
                    <Button onClick={handleLaunchApp} className="w-full">
                      <Search className="mr-2 h-4 w-4" />
                      Launch App
                    </Button>
                    <Button variant="outline" onClick={handleLogout} className="w-full">
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                ) : (
                  <Button onClick={handleLaunchApp} className="w-full">
                    Launch App
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="size-16 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="size-10 text-primary-foreground" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-primary">
                DROPIQ
              </h1>
            </div>
            <h2 className="text-xl md:text-2xl text-muted-foreground">
              Your Intelligent Command Center for Crypto Airdrop Farming
            </h2>
          </div>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Navigate the high-risk, high-reward world of airdrops with confidence. 
            We turn frantic searching into strategic, data-driven decisions through 
            our vetted discovery platform and advanced security analysis.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6" onClick={handleLaunchApp}>
              <Search className="mr-2 h-5 w-5" />
              {isAuthenticated ? 'Launch App' : 'Discover Airdrops'}
            </Button>
            <Link href="#features">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Shield className="mr-2 h-5 w-5" />
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-primary">Why Choose DROPIQ?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We're not just another airdrop list. We're your co-pilot in the 
            complex world of cryptocurrency airdrops.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="size-6 text-primary" />
              </div>
              <CardTitle>Security First</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Multi-layer vetting process with risk scoring and security analysis 
                to protect your assets from scams and malicious projects.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Search className="size-6 text-primary" />
              </div>
              <CardTitle>Smart Discovery</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                AI-powered discovery engine that identifies high-potential airdrops 
                and filters out noise, saving you time and effort.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="size-6 text-primary" />
              </div>
              <CardTitle>Data-Driven</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Comprehensive analytics including hype scores, community sentiment, 
                and eligibility requirements for informed decision-making.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto size-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Wallet className="size-6 text-primary" />
              </div>
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Track your airdrop progress, manage tasks, and maintain personal 
                notes all in one centralized home interface.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="how-it-works" className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-primary">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Get started with DROPIQ in three simple steps and begin your airdrop journey safely.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold">Connect Your Wallet</h3>
            <p className="text-muted-foreground">
              Securely connect your crypto wallet with our read-only authentication system.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-semibold">Discover Airdrops</h3>
            <p className="text-muted-foreground">
              Browse our vetted list of high-potential airdrops with detailed risk analysis.
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-semibold">Track Progress</h3>
            <p className="text-muted-foreground">
              Monitor your completion status and manage all your airdrop activities in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div id="security" className="container mx-auto px-4 py-16">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold text-primary">Security Is Our Foundation</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We operate on a read-only basis to ensure your assets remain secure at all times.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="size-6 text-primary" />
                <CardTitle>Read-Only Access</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Our platform never requests transaction permissions. We can only view your wallet 
                balance and transaction history to analyze eligibility.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Search className="size-6 text-primary" />
                <CardTitle>Risk Assessment</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Every airdrop is thoroughly vetted with our multi-point security check system 
                to identify potential scams and high-risk projects.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Start Your Airdrop Journey?</CardTitle>
            <CardDescription className="text-lg">
              Join thousands of users who trust DROPIQ for their airdrop discovery needs.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button size="lg" className="text-lg px-8 py-6" onClick={handleLaunchApp}>
              {isAuthenticated ? 'Launch App' : 'Get Started Now'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        redirectToHome={true}
      />

      {/* Footer */}
      <footer className="border-t border-border bg-surface">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                <TrendingUp className="size-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-primary">DROPIQ</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 DROPIQ. Your trusted command center for crypto airdrop farming.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}