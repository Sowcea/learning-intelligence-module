import { useState, useCallback } from 'react';
import {
  triadLearningEngine,
  type LearningCycle,
  type LearningPattern,
  type OptimizationRule,
  type CircuitBreakerState,
  type LearningInsight,
} from '@/lib/triad-rocket/learning-engine';

export function useLearningEngine() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCycle, setLastCycle] = useState<LearningCycle | null>(null);
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [rules, setRules] = useState<OptimizationRule[]>([]);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerState[]>([]);
  const [insights, setInsights] = useState<LearningInsight[]>([]);

  const runLearningCycle = useCallback(async () => {
    setIsRunning(true);
    try {
      const cycle = await triadLearningEngine.runLearningCycle();
      setLastCycle(cycle);

      // Refresh all derived data
      setPatterns(triadLearningEngine.getDetectedPatterns());
      setRules(triadLearningEngine.getOptimizationRules());
      setCircuitBreakers(triadLearningEngine.getAllCircuitBreakers());
      setInsights(triadLearningEngine.generateInsights());

      return cycle;
    } finally {
      setIsRunning(false);
    }
  }, []);

  const refreshInsights = useCallback(() => {
    setPatterns(triadLearningEngine.getDetectedPatterns());
    setRules(triadLearningEngine.getOptimizationRules());
    setCircuitBreakers(triadLearningEngine.getAllCircuitBreakers());
    setInsights(triadLearningEngine.generateInsights());
  }, []);

  return {
    isRunning,
    lastCycle,
    patterns,
    rules,
    circuitBreakers,
    insights,
    runLearningCycle,
    refreshInsights,
  };
}
