'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  AlertCircle,
  CheckCircle 
} from 'lucide-react';
import { useLogin, useRegister } from '@/hooks/use-api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface AuthFormsProps {
  onSuccess?: () => void;
  defaultTab?: 'login' | 'register';
}

export function AuthForms({ onSuccess, defaultTab = 'login' }: AuthFormsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerRole, setRegisterRole] = useState('FREE');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const router = useRouter();

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(loginEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (!validatePassword(loginPassword)) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await loginMutation.mutateAsync({
        email: loginEmail,
        password: loginPassword,
      });
      
      if (rememberMe) {
        localStorage.setItem('remember_email', loginEmail);
      }
      
      onSuccess?.();
      router.push('/dashboard');
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(registerEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (!registerUsername || registerUsername.length < 3) {
      toast.error('Username must be at least 3 characters');
      return;
    }
    
    if (!validatePassword(registerPassword)) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    if (registerPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!agreeTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    try {
      await registerMutation.mutateAsync({
        email: registerEmail,
        username: registerUsername,
        password: registerPassword,
        role: registerRole,
      });
      
      onSuccess?.();
      router.push('/dashboard');
    } catch (error) {
      // Error is handled in the mutation
    }
  };

  const LoginForm = () => (
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
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="remember" 
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked as boolean)}
        />
        <Label htmlFor="remember" className="text-sm">
          Remember me for 30 days
        </Label>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
      </Button>

      <div className="text-center">
        <Button variant="link" className="text-sm">
          Forgot your password?
        </Button>
      </div>
    </form>
  );

  const RegisterForm = () => (
    <form onSubmit={handleRegister} className="space-y-4">
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
        <Label htmlFor="register-username">Username</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-username"
            type="text"
            placeholder="Choose a username"
            value={registerUsername}
            onChange={(e) => setRegisterUsername(e.target.value)}
            className="pl-10"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-role">Account Type</Label>
        <Select value={registerRole} onValueChange={setRegisterRole}>
          <SelectTrigger>
            <SelectValue placeholder="Select account type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="FREE">
              <div className="flex flex-col">
                <span>Free</span>
                <span className="text-xs text-muted-foreground">Basic features, 5 airdrops/day</span>
              </div>
            </SelectItem>
            <SelectItem value="PREMIUM">
              <div className="flex flex-col">
                <span>Premium</span>
                <span className="text-xs text-muted-foreground">Advanced features, 50 airdrops/day</span>
              </div>
            </SelectItem>
            <SelectItem value="PRO">
              <div className="flex flex-col">
                <span>Pro</span>
                <span className="text-xs text-muted-foreground">Full access, 200 airdrops/day</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Create a password"
            value={registerPassword}
            onChange={(e) => setRegisterPassword(e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters long
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="flex items-start space-x-2">
        <Checkbox 
          id="terms" 
          checked={agreeTerms}
          onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
        />
        <Label htmlFor="terms" className="text-sm leading-none">
          I agree to the{' '}
          <Button variant="link" className="p-0 h-auto text-sm">
            Terms of Service
          </Button>{' '}
          and{' '}
          <Button variant="link" className="p-0 h-auto text-sm">
            Privacy Policy
          </Button>
        </Label>
      </div>

      <Button 
        type="submit" 
        className="w-full"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Welcome to DropIQ
        </CardTitle>
        <CardDescription className="text-center">
          Sign in to your account or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <LoginForm />
          </TabsContent>
          
          <TabsContent value="register" className="mt-6">
            <RegisterForm />
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              <div className="w-4 h-4 mr-2 rounded bg-blue-600" />
              Google
            </Button>
            <Button variant="outline" className="w-full">
              <div className="w-4 h-4 mr-2 rounded bg-gray-800" />
              GitHub
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}