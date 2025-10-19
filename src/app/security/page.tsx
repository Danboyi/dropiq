'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Lock,
  Eye,
  BookOpen,
  Flag,
  Users,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Fish,
  Bug,
  Info,
  ArrowRight
} from 'lucide-react';
import SecurityDashboard from '@/components/security/security-dashboard';
import SecurityTools from '@/components/security/security-tools';

export default function SecurityPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const securityFeatures = [
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Scam Detection',
      description: 'AI-powered analysis to identify potential scams and fraudulent projects',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      icon: <Bug className="h-6 w-6" />,
      title: 'Drainer Protection',
      description: 'Smart contract analysis to detect wallet drainers and malicious code',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      icon: <Fish className="h-6 w-6" />,
      title: 'Phishing Defense',
      description: 'URL verification and content analysis to block phishing attempts',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: 'Security Education',
      description: 'Comprehensive guides and quizzes to improve security awareness',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      icon: <Flag className="h-6 w-6" />,
      title: 'Incident Response',
      description: 'Rapid response system for security incidents and recovery guidance',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      icon: <Activity className="h-6 w-6" />,
      title: 'Real-time Monitoring',
      description: '24/7 monitoring and alerts for emerging threats',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const securityStats = [
    { label: 'Threats Blocked', value: '1,247', change: '+12%', icon: <Shield className="h-4 w-4" /> },
    { label: 'Users Protected', value: '45.2K', change: '+8%', icon: <Users className="h-4 w-4" /> },
    { label: 'Scams Reported', value: '342', change: '+15%', icon: <Flag className="h-4 w-4" /> },
    { label: 'Success Rate', value: '99.2%', change: '+0.3%', icon: <CheckCircle className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10" />
        <div className="container mx-auto px-4 py-16 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="outline" className="mb-4 text-sm">
              <Shield className="w-3 h-3 mr-1" />
              Advanced Security Protection
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Stay Safe in the
              <br />
              <span className="text-primary">Web3 World</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Comprehensive security tools powered by AI to protect you from scams, 
              drainers, and phishing attacks. Monitor, analyze, and secure your crypto journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-base px-8" onClick={() => setActiveTab('tools')}>
                Try Security Tools
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" size="lg" className="text-base px-8">
                Learn More
                <BookOpen className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {securityStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg mr-2">
                    {stat.icon}
                  </div>
                  <div className="text-3xl font-bold text-primary">{stat.value}</div>
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
                <div className="text-xs text-green-600 mt-1">{stat.change}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Comprehensive Protection</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our multi-layered security approach ensures you're protected from all types of threats
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader>
                  <div className={`w-16 h-16 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4`}>
                    <div className={feature.color}>
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto font-normal">
                    Learn more <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Alert */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-900">Security Best Practices</AlertTitle>
            <AlertDescription className="text-blue-800">
              Always verify project authenticity, never share your private keys, and use our security tools 
              before interacting with any new platform or contract. When in doubt, ask the community or 
              contact our security team.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Main Security Interface */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Security Command Center</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Monitor threats, scan projects, and manage your security settings
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
              <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="tools" className="flex items-center space-x-2">
                <Search className="h-4 w-4" />
                <span>Tools</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <SecurityDashboard />
            </TabsContent>

            <TabsContent value="tools" className="space-y-6">
              <SecurityTools />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="border-0 shadow-xl bg-gradient-to-r from-primary/5 to-secondary/5">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">
                Need Help with Security?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Our security team is available 24/7 to help you with any security concerns 
                or questions. Don't hesitate to reach out if you suspect any malicious activity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-base px-8">
                  Contact Security Team
                  <Shield className="w-4 h-4 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="text-base px-8">
                  Report Incident
                  <Flag className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}