import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ─── Types ───────────────────────────────────────────────
export interface GlobalLearningPattern {
  id: string;
  pattern_name: string;
  pattern_type: string;
  origin_country: string;
  region: string | null;
  success_rate: number;
  impact_score: number;
  confidence_level: number;
  sample_size: number;
  cross_border_applicability: Record<string, number>;
  replicated_to: string[];
  replication_results: Record<string, any>;
  auto_replicate: boolean;
  feature_importance: Record<string, any>;
  similar_patterns: string[];
  source_module: string | null;
  source_agent: string | null;
  first_seen: string;
  last_seen: string;
  peak_activity: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CountryLearningHealth {
  id: string;
  country_code: string;
  patterns_discovered: number;
  patterns_applied: number;
  success_rate_local: number;
  patterns_exported: number;
  patterns_imported: number;
  net_influence: number;
  model_accuracy: number;
  last_trained: string | null;
  avg_learning_cycle_hours: number;
  top_performing_patterns: string[];
  learning_score: number;
  innovation_rate: number;
  receptivity: number;
  global_rank: number;
}

export interface ReplicationLog {
  id: string;
  pattern_id: string;
  source_country: string;
  target_country: string;
  status: string;
  success: boolean | null;
  success_rate_at_target: number | null;
  impact_at_target: number | null;
  notes: string | null;
  replicated_at: string;
  completed_at: string | null;
}

export interface GlobalLearningStats {
  totalPatterns: number;
  activePatterns: number;
  avgSuccessRate: number;
  avgImpactScore: number;
  totalReplications: number;
  successfulReplications: number;
  countriesActive: number;
  topCountry: string | null;
  patternsLast24h: number;
  crossBorderOpportunities: number;
}

export interface FeedbackLog {
  id: string;
  agent_id: string | null;
  module: string | null;
  action: string | null;
  input_context: Record<string, any> | null;
  output_result: Record<string, any> | null;
  success_rate: number | null;
  impact_score: number | null;
  timestamp: string;
}

interface UseGlobalLearningOptions {
  autoRefresh?: boolean;
  countryCode?: string;
  patternType?: string;
  days?: number;
}

export const useGlobalLearning = (options: UseGlobalLearningOptions = {}) => {
  const { autoRefresh = true, countryCode, patternType, days = 30 } = options;

  const [patterns, setPatterns] = useState<GlobalLearningPattern[]>([]);
  const [countryHealth, setCountryHealth] = useState<CountryLearningHealth[]>([]);
  const [replications, setReplications] = useState<ReplicationLog[]>([]);
  const [feedbackLogs, setFeedbackLogs] = useState<FeedbackLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const startDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  }, [days]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch patterns
      let patternsQuery = supabase
        .from('global_learning_patterns')
        .select('*')
        .eq('is_active', true)
        .order('last_seen', { ascending: false })
        .limit(100);

      if (countryCode) patternsQuery = patternsQuery.eq('origin_country', countryCode);
      if (patternType) patternsQuery = patternsQuery.eq('pattern_type', patternType);

      // Fetch country health
      const healthQuery = supabase
        .from('country_learning_health')
        .select('*')
        .order('learning_score', { ascending: false });

      // Fetch replications
      const replicationsQuery = supabase
        .from('learning_replication_log')
        .select('*')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(50);

      // Fetch neural feedback logs
      let feedbackQuery = supabase
        .from('neural_feedback_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      const [patternsRes, healthRes, replicationsRes, feedbackRes] = await Promise.all([
        patternsQuery,
        healthQuery,
        replicationsQuery,
        feedbackQuery,
      ]);

      if (patternsRes.error) throw patternsRes.error;
      if (healthRes.error) throw healthRes.error;
      if (replicationsRes.error) throw replicationsRes.error;

      setPatterns((patternsRes.data as unknown as GlobalLearningPattern[]) || []);
      setCountryHealth((healthRes.data as unknown as CountryLearningHealth[]) || []);
      setReplications((replicationsRes.data as unknown as ReplicationLog[]) || []);
      setFeedbackLogs((feedbackRes.data as unknown as FeedbackLog[]) || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (err: any) {
      console.error('Global learning fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [countryCode, patternType, startDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  // Computed stats
  const stats: GlobalLearningStats = useMemo(() => {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const successfulReps = replications.filter(r => r.success === true);
    const topCountryEntry = countryHealth.length > 0 ? countryHealth[0] : null;

    return {
      totalPatterns: patterns.length,
      activePatterns: patterns.filter(p => p.is_active).length,
      avgSuccessRate: patterns.length
        ? patterns.reduce((sum, p) => sum + (p.success_rate || 0), 0) / patterns.length
        : 0,
      avgImpactScore: patterns.length
        ? patterns.reduce((sum, p) => sum + (p.impact_score || 0), 0) / patterns.length
        : 0,
      totalReplications: replications.length,
      successfulReplications: successfulReps.length,
      countriesActive: countryHealth.length,
      topCountry: topCountryEntry?.country_code || null,
      patternsLast24h: patterns.filter(p => p.created_at >= last24h).length,
      crossBorderOpportunities: patterns.filter(
        p => p.success_rate > 0.8 && p.replicated_to.length < countryHealth.length
      ).length,
    };
  }, [patterns, replications, countryHealth]);

  const exportData = useCallback(
    async (format: 'csv' | 'json') => {
      const exportPayload = { patterns, countryHealth, replications, exported_at: new Date().toISOString() };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `learning_export_${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const headers = ['id', 'pattern_name', 'pattern_type', 'origin_country', 'success_rate', 'impact_score', 'sample_size'];
        const rows = patterns.map(p => headers.map(h => (p as any)[h] ?? '').join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `learning_export_${new Date().toISOString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    },
    [patterns, countryHealth, replications]
  );

  return {
    patterns,
    countryHealth,
    replications,
    feedbackLogs,
    stats,
    loading,
    error,
    lastUpdated,
    refresh: fetchData,
    exportData,
  };
};
