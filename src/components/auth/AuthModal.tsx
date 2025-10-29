'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  defaultTab?: 'login' | 'register'
  redirectToHome?: boolean
}

export function AuthModal({ isOpen, onClose, defaultTab = 'login', redirectToHome = false }: AuthModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [showSuccess, setShowSuccess] = useState(false)
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerName, setRegisterName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const { 
    login, 
    register, 
    isLoading, 
    error, 
    clearError,
    user,
    token
  } = useAuthStore()

  // Close modal automatically after successful authentication
  useEffect(() => {
    if (user && token && isOpen) {
      setShowSuccess(true)
      // Small delay to show success state
      const timer = setTimeout(() => {
        onClose()
        // Reset forms and success state
        setShowSuccess(false)
        setLoginEmail('')
        setLoginPassword('')
        setRegisterEmail('')
        setRegisterPassword('')
        setRegisterName('')
        setConfirmPassword('')
        
        // Redirect to home if requested
        if (redirectToHome) {
          router.push('/home')
        }
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [user, token, isOpen, onClose, redirectToHome, router])

  // Reset success state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowSuccess(false)
    }
  }, [isOpen])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!loginEmail || !loginPassword) {
      return
    }

    await login(loginEmail, loginPassword)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    
    if (!registerEmail || !registerPassword || !confirmPassword) {
      return
    }

    if (registerPassword !== confirmPassword) {
      return
    }

    if (registerPassword.length < 8) {
      return
    }

    await register(registerEmail, registerPassword, registerName)
  }

  const handleClose = () => {
    clearError()
    setShowSuccess(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <div className="text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800">
                {activeTab === 'login' ? 'Welcome Back!' : 'Account Created!'}
              </h3>
              <p className="text-sm text-green-600">
                {activeTab === 'login' ? 'Successfully logged in' : 'Your account has been created successfully'}
              </p>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Authentication
          </DialogTitle>
          <DialogDescription>
            Create an account to save your progress and access premium features
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !loginEmail || !loginPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Register Tab */}
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">Name (Optional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Enter your name"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="Enter your email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Create a password (min. 8 characters)"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="pl-10"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {registerPassword && confirmPassword && registerPassword !== confirmPassword && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Passwords do not match</AlertDescription>
                </Alert>
              )}

              {registerPassword && registerPassword.length < 8 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Password must be at least 8 characters</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={
                  isLoading || 
                  !registerEmail || 
                  !registerPassword || 
                  !confirmPassword ||
                  registerPassword !== confirmPassword ||
                  registerPassword.length < 8
                }
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-sm text-muted-foreground">
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </div>
      </DialogContent>
    </Dialog>
  )
}