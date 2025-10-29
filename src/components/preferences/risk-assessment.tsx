'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  TrendingUp, 
  Clock, 
  Activity,
  Brain,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

interface RiskProfileData {
  riskToleranceScore: number;
  riskCategory: 'conservative' | 'moderate' | 'balanced' | 'growth' | 'aggressive';
  financialCapacity: 'low' | 'medium' | 'high' | 'very_high';
  lossAcceptance: number;
  timeHorizon: 'short' | 'medium' | 'long';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  technicalKnowledge: number;
  securityConsciousness: number;
  recommendations: string[];
  riskFactors: Array<{
    factor: string;
    weight: number;
    score: number;
  }>;
  confidenceScore: number;
}

interface RiskAssessmentProps {
  userId: string;
  initialData?: RiskProfileData;
  onComplete?: (data: RiskProfileData) => void;
}

const riskQuestions = [
  {
    id: 'investmentExperience',
    question: 'How would you describe your investment experience?',
    options: [
      { value: 1, label: 'Complete beginner - never invested before' },
      { value: 2, label: 'Novice - some basic knowledge' },
      { value: 3, label: 'Intermediate - comfortable with basic investments' },
      { value: 4, label: 'Advanced - experienced with various investment types' },
      { value: 5, label: 'Expert - professional investment experience' }
    ]
  },
  {
    id: 'riskCapacity',
    question: 'How much capital are you comfortable allocating to high-risk opportunities?',
    options: [
      { value: 1, label: 'Very little - only what I can afford to lose completely' },
      { value: 2, label: 'Small amount - less than 5% of my portfolio' },
      { value: 3, label: 'Moderate amount - 5-15% of my portfolio' },
      { value: 4, label: 'Significant amount - 15-30% of my portfolio' },
      { value: 5, label: 'Substantial amount - more than 30% of my portfolio' }
    ]
  },
  {
    id: 'timeHorizon',
    question: 'What is your typical investment time horizon?',
    options: [
      { value: 1, label: 'Very short - less than 1 month' },
      { value: 2, label: 'Short - 1-6 months' },
      { value: 3, label: 'Medium - 6-12 months' },
      { value: 4, label: 'Long - 1-2 years' },
      { value: 5, label: 'Very long - more than 2 years' }
    ]
  },
  {
    id: 'technicalKnowledge',
    question: 'How would you rate your technical knowledge of blockchain and DeFi?',
    options: [
      { value: 1, label: 'No technical knowledge' },
      { value: 2, label: 'Basic understanding - know what blockchain is' },
      { value: 3, label: 'Intermediate - understand how transactions work' },
      { value: 4, label: 'Advanced - understand smart contracts and protocols' },
      { value: 5, label: 'Expert - can read code and understand complex mechanisms' }
    ]
  },
  {
    id: 'securityPriority',
    question: 'How important is security when participating in airdrops?',
    options: [
      { value: 1, label: 'Not a major concern' },
      { value: 2, label: 'Somewhat important' },
      { value: 3, label: 'Important' },
      { value: 4, label: 'Very important' },
      { value: 5, label: 'Absolutely critical - security is my top priority' }
    ]
  },
  {
    id: 'lossTolerance',
    question: 'How would you react to losing 20% of your airdrop investment?',
    options: [
      { value: 1, label: 'Panic and sell everything immediately' },
      { value: 2, label: 'Very concerned - would significantly reduce exposure' },
      { value: 3, label: 'Concerned - but would hold if fundamentals are good' },
      { value: 4, label: 'Accepting - losses are part of investing' },
      { value: 5, label: 'Unfazed - would consider investing more' }
    ]
  },
  {
    id: 'diversificationUnderstanding',
    question: 'How important is diversification in your airdrop strategy?',
    options: [
      { value: 1, label: 'Prefer to focus on one or two promising projects' },
      { value: 2, label: 'Some diversification is good' },
      { value: 3, label: 'Moderate diversification across different types' },
      { value: 4, label: 'Heavy diversification is essential' },
      { value: 5, label: 'Maximum diversification - never put all eggs in one basket' }
    ]
  },
  {
    id: 'volatilityComfort',
    question: 'How comfortable are you with extreme price volatility?',
    options: [
      { value: 1, label: 'Very uncomfortable - prefer stable assets' },
      { value: 2, label: 'Somewhat uncomfortable' },
      { value: 3, label: 'Neutral - can handle moderate volatility' },
      { value: 4, label: 'Comfortable - understand volatility creates opportunities' },
      { value: 5, label: 'Very comfortable - thrive in volatile markets' }
    ]
  }
];

export function RiskAssessment({ userId, initialData, onComplete }: RiskAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<RiskProfileData | null>(initialData || null);
  const [showResults, setShowResults] = useState(!!initialData);

  const handleAnswer = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < riskQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== riskQuestions.length) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/preferences/risk-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, answers })
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
        setShowResults(true);
        onComplete?.(data.data);
      }
    } catch (error) {
      console.error('Error submitting risk assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskCategoryColor = (category: string) => {
    switch (category) {
      case 'conservative': return 'bg-green-500';
      case 'moderate': return 'bg-blue-500';
      case 'balanced': return 'bg-yellow-500';
      case 'growth': return 'bg-orange-500';
      case 'aggressive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskCategoryIcon = (category: string) => {
    switch (category) {
      case 'conservative': return <Shield className="h-4 w-4" />;
      case 'moderate': return <TrendingUp className="h-4 w-4" />;
      case 'balanced': return <Activity className="h-4 w-4" />;
      case 'growth': return <TrendingUp className="h-4 w-4" />;
      case 'aggressive': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (showResults && result) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Your Risk Profile
            </CardTitle>
            <CardDescription>
              Based on your assessment, here's your personalized risk profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Risk Score */}
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold">{result.riskToleranceScore}/100</div>
              <Badge 
                className={`${getRiskCategoryColor(result.riskCategory)} text-white`}
              >
                <div className="flex items-center gap-1">
                  {getRiskCategoryIcon(result.riskCategory)}
                  {result.riskCategory.charAt(0).toUpperCase() + result.riskCategory.slice(1)}
                </div>
              </Badge>
              <div className="text-sm text-muted-foreground">
                Confidence: {Math.round(result.confidenceScore * 100)}%
              </div>
            </div>

            {/* Risk Factors */}
            <div className="space-y-3">
              <h4 className="font-medium">Risk Assessment Breakdown</h4>
              <div className="space-y-2">
                {result.riskFactors.map((factor, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm capitalize">
                      {factor.factor.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      <Progress value={factor.score} className="w-20 h-2" />
                      <span className="text-sm font-medium w-10">{factor.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Profile Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Experience Level</div>
                <Badge variant="outline">
                  {result.experienceLevel.charAt(0).toUpperCase() + result.experienceLevel.slice(1)}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Financial Capacity</div>
                <Badge variant="outline">
                  {result.financialCapacity.charAt(0).toUpperCase() + result.financialCapacity.slice(1)}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Loss Acceptance</div>
                <div className="text-sm">{result.lossAcceptance}%</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium">Time Horizon</div>
                <div className="text-sm capitalize">{result.timeHorizon}</div>
              </div>
            </div>

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Personalized Recommendations</h4>
                <div className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={() => {
                setShowResults(false);
                setCurrentQuestion(0);
                setAnswers({});
              }}
              variant="outline"
              className="w-full"
            >
              Retake Assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = riskQuestions[currentQuestion];
  const progress = ((currentQuestion + 1) / riskQuestions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Risk Assessment
            </CardTitle>
            <Badge variant="outline">
              {currentQuestion + 1} / {riskQuestions.length}
            </Badge>
          </div>
          <Progress value={progress} className="mt-2" />
        </CardHeader>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((option) => (
              <div
                key={option.value}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  answers[question.id] === option.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => handleAnswer(question.id, option.value)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm">{option.label}</span>
                  {answers[question.id] === option.value && (
                    <CheckCircle className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!answers[question.id] || isSubmitting}
          >
            {isSubmitting ? 'Analyzing...' : 
             currentQuestion === riskQuestions.length - 1 ? 'Complete Assessment' : 'Next'}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}