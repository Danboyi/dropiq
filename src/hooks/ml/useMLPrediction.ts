import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { mlInfrastructure } from '@/lib/ml/infrastructure';

interface PredictionOptions {
  modelType: string;
  inputFeatures: any;
  refreshInterval?: number; // in milliseconds
  enabled?: boolean;
}

interface PredictionResult {
  prediction: any;
  confidence: number;
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
}

export function useMLPrediction(options: PredictionOptions): PredictionResult {
  const { data: session } = useSession();
  const [prediction, setPrediction] = useState<any>(null);
  const [confidence, setConfidence] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const executePrediction = useCallback(async () => {
    if (!session?.user?.id || !options.enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mlInfrastructure.makePrediction(
        session.user.id,
        options.modelType,
        options.inputFeatures
      );

      setPrediction(result);
      setConfidence(result.confidence || 0.5);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('❌ ML Prediction failed:', err);
      setError(err instanceof Error ? err.message : 'Prediction failed');
      setPrediction(null);
      setConfidence(0);
    } finally {
      setIsLoading(false);
    }
  }, [session, options]);

  // Auto-refresh prediction
  useEffect(() => {
    if (!options.enabled || !options.refreshInterval) {
      return;
    }

    const interval = setInterval(executePrediction, options.refreshInterval);
    return () => clearInterval(interval);
  }, [executePrediction, options.refreshInterval, options.enabled]);

  // Initial prediction
  useEffect(() => {
    if (options.enabled) {
      executePrediction();
    }
  }, [executePrediction, options.enabled]);

  return {
    prediction,
    confidence,
    isLoading,
    error,
    lastUpdated,
    refresh: executePrediction,
  };
}

// Hook for airdrop recommendations
export function useAirdropRecommendations(enabled: boolean = true) {
  const { data: session } = useSession();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(async () => {
    if (!session?.user?.id || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate user feature vector
      const userFeatures = await mlInfrastructure.generateUserFeatureVector(session.user.id);
      
      // Get AI-powered recommendations
      const result = await mlInfrastructure.makePrediction(
        session.user.id,
        'airdrop_recommendation',
        userFeatures
      );

      setRecommendations(result.recommendations || []);
    } catch (err) {
      console.error('❌ Failed to get airdrop recommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [session, enabled]);

  useEffect(() => {
    getRecommendations();
  }, [getRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refresh: getRecommendations,
  };
}

// Hook for risk assessment
export function useRiskAssessment(enabled: boolean = true) {
  const { data: session } = useSession();
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const assessRisk = useCallback(async () => {
    if (!session?.user?.id || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate user feature vector
      const userFeatures = await mlInfrastructure.generateUserFeatureVector(session.user.id);
      
      // Get AI-powered risk assessment
      const result = await mlInfrastructure.makePrediction(
        session.user.id,
        'risk_assessment',
        userFeatures
      );

      setRiskAssessment(result);
    } catch (err) {
      console.error('❌ Failed to assess risk:', err);
      setError(err instanceof Error ? err.message : 'Failed to assess risk');
      setRiskAssessment(null);
    } finally {
      setIsLoading(false);
    }
  }, [session, enabled]);

  useEffect(() => {
    assessRisk();
  }, [assessRisk]);

  return {
    riskAssessment,
    isLoading,
    error,
    refresh: assessRisk,
  };
}

// Hook for success prediction
export function useSuccessPrediction(airdropId: string, enabled: boolean = true) {
  const { data: session } = useSession();
  const [successPrediction, setSuccessPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const predictSuccess = useCallback(async () => {
    if (!session?.user?.id || !airdropId || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate user and airdrop feature vectors
      const [userFeatures, airdropFeatures] = await Promise.all([
        mlInfrastructure.generateUserFeatureVector(session.user.id),
        mlInfrastructure.generateAirdropFeatureVector(airdropId),
      ]);
      
      // Get AI-powered success prediction
      const result = await mlInfrastructure.makePrediction(
        session.user.id,
        'success_prediction',
        { user: userFeatures, airdrop: airdropFeatures }
      );

      setSuccessPrediction(result);
    } catch (err) {
      console.error('❌ Failed to predict success:', err);
      setError(err instanceof Error ? err.message : 'Failed to predict success');
      setSuccessPrediction(null);
    } finally {
      setIsLoading(false);
    }
  }, [session, airdropId, enabled]);

  useEffect(() => {
    predictSuccess();
  }, [predictSuccess]);

  return {
    successPrediction,
    isLoading,
    error,
    refresh: predictSuccess,
  };
}

// Hook for user insights
export function useUserInsights(enabled: boolean = true) {
  const { data: session } = useSession();
  const [insights, setInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getInsights = useCallback(async () => {
    if (!session?.user?.id || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate comprehensive user insights
      const userFeatures = await mlInfrastructure.generateUserFeatureVector(session.user.id);
      
      // Get AI-powered insights
      const result = await mlInfrastructure.makePrediction(
        session.user.id,
        'user_insights',
        userFeatures
      );

      setInsights(result);
    } catch (err) {
      console.error('❌ Failed to get user insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to get insights');
      setInsights(null);
    } finally {
      setIsLoading(false);
    }
  }, [session, enabled]);

  useEffect(() => {
    getInsights();
  }, [getInsights]);

  return {
    insights,
    isLoading,
    error,
    refresh: getInsights,
  };
}

// Hook for real-time personalization
export function usePersonalization(enabled: boolean = true) {
  const { data: session } = useSession();
  const [personalization, setPersonalization] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getPersonalization = useCallback(async () => {
    if (!session?.user?.id || !enabled) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate personalization data
      const userFeatures = await mlInfrastructure.generateUserFeatureVector(session.user.id);
      
      // Get AI-powered personalization
      const result = await mlInfrastructure.makePrediction(
        session.user.id,
        'personalization',
        userFeatures
      );

      setPersonalization(result);
    } catch (err) {
      console.error('❌ Failed to get personalization:', err);
      setError(err instanceof Error ? err.message : 'Failed to get personalization');
      setPersonalization(null);
    } finally {
      setIsLoading(false);
    }
  }, [session, enabled]);

  useEffect(() => {
    getPersonalization();
  }, [getPersonalization]);

  return {
    personalization,
    isLoading,
    error,
    refresh: getPersonalization,
  };
}