import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface TriadMetrics {
  triad: "family" | "governance" | "rocket";
  totalActions: number;
  successRate: number;
  avgQualityScore: number;
  totalCostUsd: number;
  avgExecutionMs: number;
  activeAgents: number;
  topPattern: string | null;
  lastActivity: string | null;
}

export interface GlobalMetrics {
  totalActions: number;
  successRate: number;
  avgQualityScore: number;
  totalCostUsd: number;
  totalSavingsUsd: number;
  uniqueAgents: number;
  uniqueTools: number;
}

export interface AgentStat {
  agent_name: string;
  triad: string;
  total_actions: number;
  success_rate: number;
  avg_quality: number;
  total_cost: number;
  avg_ms: number;
  last_action: string | null;
}

export interface RecentPattern {
  pattern: string;
  triad: string;
  count: number;
  avg_quality: number;
}

export function useTriadLearning(timeRange: string = "7d") {
  const [globalMetrics, setGlobalMetrics] = useState<GlobalMetrics | null>(null);
  const [triadMetrics, setTriadMetrics] = useState<TriadMetrics[]>([]);
  const [agentStats, setAgentStats] = useState<AgentStat[]>([]);
  const [recentPatterns, setRecentPatterns] = useState<RecentPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getInterval = (range: string) => {
    const map: Record<string, string> = {
      "1d": "1 day", "7d": "7 days", "30d": "30 days", "90d": "90 days"
    };
    return map[range] ?? "7 days";
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const interval = getInterval(timeRange);
      const since = new Date(Date.now() - parseDuration(timeRange)).toISOString();

      // Global metrics
      const { data: global } = await supabase
        .from("ecosystem_learning_logs")
        .select("success, quality_score, cost_usd, execution_time_ms, agent_name, tool_used")
        .gte("created_at", since);

      if (global) {
        const total = global.length;
        const successful = global.filter(r => r.success).length;
        const totalCost = global.reduce((s, r) => s + (r.cost_usd ?? 0), 0);
        const qualities = global.filter(r => r.quality_score).map(r => r.quality_score!);
        const avgQuality = qualities.length ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 0;
        const uniqueAgents = new Set(global.map(r => r.agent_name).filter(Boolean)).size;
        const uniqueTools = new Set(global.map(r => r.tool_used).filter(Boolean)).size;

        setGlobalMetrics({
          totalActions: total,
          successRate: total ? (successful / total) * 100 : 0,
          avgQualityScore: avgQuality,
          totalCostUsd: totalCost,
          totalSavingsUsd: totalCost * 0.72, // estimated savings vs manual
          uniqueAgents,
          uniqueTools,
        });
      }

      // Per-triad metrics via dify_agent_registry join
      const { data: registry } = await supabase
        .from("dify_agent_registry")
        .select("agent_name, triad, is_active");

      if (registry && global) {
        const registryMap: Record<string, string> = {};
        registry.forEach(r => { if (r.agent_name) registryMap[r.agent_name.toLowerCase()] = r.triad; });

        const triads: ("family" | "governance" | "rocket")[] = ["family", "governance", "rocket"];
        const metrics: TriadMetrics[] = triads.map(triad => {
          const triadAgents = registry.filter(r => r.triad === triad).map(r => r.agent_name?.toLowerCase());
          const logs = global.filter(r => r.agent_name && triadAgents.includes(r.agent_name.toLowerCase()));
          const total = logs.length;
          const successful = logs.filter(r => r.success).length;
          const qualities = logs.filter(r => r.quality_score).map(r => r.quality_score!);
          const times = logs.filter(r => r.execution_time_ms).map(r => r.execution_time_ms!);
          const activeAgents = registry.filter(r => r.triad === triad && r.is_active).length;

          return {
            triad,
            totalActions: total,
            successRate: total ? (successful / total) * 100 : 0,
            avgQualityScore: qualities.length ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 0,
            totalCostUsd: logs.reduce((s, r) => s + (r.cost_usd ?? 0), 0),
            avgExecutionMs: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
            activeAgents,
            topPattern: null,
            lastActivity: logs.length ? logs[logs.length - 1]?.created_at ?? null : null,
          };
        });
        setTriadMetrics(metrics);
      }

      // Agent-level stats
      const { data: agentLogs } = await supabase
        .from("ecosystem_learning_logs")
        .select("agent_name, success, quality_score, cost_usd, execution_time_ms, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false });

      if (agentLogs && registry) {
        const agentMap: Record<string, { logs: typeof agentLogs; triad: string }> = {};
        agentLogs.forEach(log => {
          const name = log.agent_name ?? "unknown";
          if (!agentMap[name]) {
            const reg = registry.find(r => r.agent_name?.toLowerCase() === name.toLowerCase());
            agentMap[name] = { logs: [], triad: reg?.triad ?? "unknown" };
          }
          agentMap[name].logs.push(log);
        });

        const stats: AgentStat[] = Object.entries(agentMap).map(([name, { logs, triad }]) => {
          const total = logs.length;
          const successful = logs.filter(r => r.success).length;
          const qualities = logs.filter(r => r.quality_score).map(r => r.quality_score!);
          const times = logs.filter(r => r.execution_time_ms).map(r => r.execution_time_ms!);
          return {
            agent_name: name,
            triad,
            total_actions: total,
            success_rate: total ? (successful / total) * 100 : 0,
            avg_quality: qualities.length ? qualities.reduce((a, b) => a + b, 0) / qualities.length : 0,
            total_cost: logs.reduce((s, r) => s + (r.cost_usd ?? 0), 0),
            avg_ms: times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0,
            last_action: logs[0]?.created_at ?? null,
          };
        });
        setAgentStats(stats.sort((a, b) => b.total_actions - a.total_actions));
      }

    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { globalMetrics, triadMetrics, agentStats, recentPatterns, loading, error, refetch: fetchData };
}

function parseDuration(range: string): number {
  const map: Record<string, number> = {
    "1d": 86400000, "7d": 604800000, "30d": 2592000000, "90d": 7776000000
  };
  return map[range] ?? 604800000;
}
