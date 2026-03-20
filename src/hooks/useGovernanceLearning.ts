import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type {
  GovernanceLearningPattern,
  SynergyScore,
  WeeklyReview,
  InterventionRule,
} from '@/lib/triad-rocket/learning-engine';

export interface CircuitBreakerEntry {
  id: string;
  agentId: string;
  agentTriad: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  successCount: number;
  threshold: number;
  lastFailure: string | null;
  lastSuccess: string | null;
  openedAt: string | null;
}

export function useGovernanceLearning() {
  const [patterns, setPatterns] = useState<GovernanceLearningPattern[]>([]);
  const [synergyScores, setSynergyScores] = useState<SynergyScore[]>([]);
  const [weeklyReviews, setWeeklyReviews] = useState<WeeklyReview[]>([]);
  const [interventionRules, setInterventionRules] = useState<InterventionRule[]>([]);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [patternsRes, synergyRes, reviewsRes, rulesRes, breakersRes] = await Promise.all([
      supabase.from('governance_learning_patterns').select('*').order('last_detected', { ascending: false }).limit(50),
      supabase.from('triad_synergy_scores').select('*').order('synergy_score', { ascending: false }),
      supabase.from('governance_weekly_reviews').select('*').order('reviewed_at', { ascending: false }).limit(12),
      supabase.from('sos_intervention_rules').select('*').order('intervention_level', { ascending: true }),
      supabase.from('governance_circuit_breakers').select('*').order('agent_triad', { ascending: true }),
    ]);

    if (patternsRes.data) {
      setPatterns(patternsRes.data.map((p: any) => ({
        patternId: p.pattern_id,
        patternType: p.pattern_type,
        sourceTriad: p.source_triad,
        targetTriad: p.target_triad,
        flowDirection: p.flow_direction,
        signature: p.signature,
        description: p.description || '',
        confidence: Number(p.confidence) || 0,
        occurrences: p.occurrences || 0,
        impact: p.impact || 'neutral',
        impactScore: Number(p.impact_score) || 0,
        suggestedActions: p.suggested_actions || [],
      })));
    }

    if (synergyRes.data) {
      setSynergyScores(synergyRes.data.map((s: any) => ({
        flowCombination: s.flow_combination,
        synergyScore: Number(s.synergy_score) || 0,
        successRate: Number(s.success_rate) || 0,
        totalInteractions: s.total_interactions || 0,
        optimizationLevel: s.optimization_level || 'baseline',
      })));
    }

    if (reviewsRes.data) {
      setWeeklyReviews(reviewsRes.data.map((r: any) => ({
        id: r.id,
        reviewWeek: r.review_week,
        patternsAnalyzed: r.patterns_analyzed || 0,
        optimizationsProposed: r.optimizations_proposed || 0,
        optimizationsApproved: r.optimizations_approved || 0,
        overallHealthAvg: Number(r.overall_health_avg) || 0,
        autonomyScore: Number(r.autonomy_score) || 0,
        motherBrainApproval: r.mother_brain_approval || 'pending',
        recommendations: r.recommendations || [],
      })));
    }

    if (rulesRes.data) {
      setInterventionRules(rulesRes.data.map((r: any) => ({
        id: r.id,
        ruleName: r.rule_name,
        ruleType: r.rule_type,
        interventionLevel: r.intervention_level,
        healthThreshold: r.health_threshold != null ? Number(r.health_threshold) : null,
        autoExecute: r.auto_execute || false,
        healingStrategy: r.healing_strategy,
        isActive: r.is_active !== false,
        triggerCount: r.trigger_count || 0,
        successCount: r.success_count || 0,
      })));
    }

    if (breakersRes.data) {
      setCircuitBreakers(breakersRes.data.map((b: any) => ({
        id: b.id,
        agentId: b.agent_id,
        agentTriad: b.agent_triad,
        state: b.state || 'closed',
        failureCount: b.failure_count || 0,
        successCount: b.success_count || 0,
        threshold: b.threshold || 5,
        lastFailure: b.last_failure,
        lastSuccess: b.last_success,
        openedAt: b.opened_at,
      })));
    }

    setLoading(false);
  }, []);

  const runGovernanceLearningCycle = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cross-triad-orchestrator', {
        body: {
          action: 'governance_decision',
          payload: {
            command: 'Run tri-directional learning cycle: analyze all 6 flow permutations, detect patterns, update synergy scores, and generate optimization recommendations',
            command_type: 'pattern_optimization',
            severity: 'low',
          },
        },
      });
      if (error) throw error;
      toast({ title: 'Learning Cycle Triggered', description: 'Tri-directional analysis started across all triads' });
      await fetchAll();
      return data;
    } catch (e) {
      toast({ title: 'Learning Cycle Failed', description: String(e), variant: 'destructive' });
      return null;
    }
  }, [toast, fetchAll]);

  const toggleInterventionRule = useCallback(async (ruleId: string, isActive: boolean) => {
    try {
      await supabase
        .from('sos_intervention_rules')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', ruleId);
      toast({ title: 'Rule Updated', description: `Rule ${isActive ? 'activated' : 'deactivated'}` });
      await fetchAll();
    } catch (e) {
      toast({ title: 'Update Failed', description: String(e), variant: 'destructive' });
    }
  }, [toast, fetchAll]);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel('governance-learning-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'governance_learning_patterns' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'triad_synergy_scores' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'governance_circuit_breakers' }, () => fetchAll())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_intervention_rules' }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  // Derived metrics
  const avgSynergyScore = synergyScores.length > 0
    ? synergyScores.reduce((s, sc) => s + sc.synergyScore, 0) / synergyScores.length
    : 0;

  const openBreakers = circuitBreakers.filter(b => b.state !== 'closed');
  const activeRules = interventionRules.filter(r => r.isActive);
  const totalTriggers = interventionRules.reduce((s, r) => s + r.triggerCount, 0);

  return {
    patterns,
    synergyScores,
    weeklyReviews,
    interventionRules,
    circuitBreakers,
    loading,
    avgSynergyScore,
    openBreakers,
    activeRules,
    totalTriggers,
    runGovernanceLearningCycle,
    toggleInterventionRule,
    refetch: fetchAll,
  };
}
