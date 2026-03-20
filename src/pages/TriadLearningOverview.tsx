import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTriadLearning } from "@/hooks/useTriadLearning";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Brain, Users, Shield, Rocket, TrendingUp,
  DollarSign, Zap, Target, RefreshCw, ArrowRight,
  CheckCircle, Clock, BarChart2, Sparkles
} from "lucide-react";

const TRIADS = [
  {
    key: "family" as const,
    label: "Family Triad",
    description: "8 agents — commerce, marketing, support",
    icon: Users,
    gradient: "from-purple-600/20 to-violet-600/10",
    border: "border-purple-500/30",
    accent: "text-purple-400",
    badge: "bg-purple-500/15 text-purple-300 border-purple-500/30",
    path: "/family",
    ring: "ring-purple-500/20",
  },
  {
    key: "governance" as const,
    label: "Governance Triad",
    description: "3 agents — security, autonomy, circuit breakers",
    icon: Shield,
    gradient: "from-blue-600/20 to-cyan-600/10",
    border: "border-blue-500/30",
    accent: "text-blue-400",
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    path: "/governance",
    ring: "ring-blue-500/20",
  },
  {
    key: "rocket" as const,
    label: "Rocket Triad",
    description: "3 agents — n8n, Claude Code, OpenClaw",
    icon: Rocket,
    gradient: "from-orange-600/20 to-amber-600/10",
    border: "border-orange-500/30",
    accent: "text-orange-400",
    badge: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    path: "/rocket",
    ring: "ring-orange-500/20",
  },
];

export default function TriadLearningOverview() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState("7d");
  const { globalMetrics, triadMetrics, loading, refetch } = useTriadLearning(timeRange);

  const getTriadData = (key: string) =>
    triadMetrics.find(t => t.triad === key);

  const fmt = (n: number | undefined, decimals = 1) =>
    n !== undefined ? n.toFixed(decimals) : "—";

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-semibold text-slate-100">Learning Overview</h1>
            <Badge className="bg-violet-500/15 text-violet-300 border border-violet-500/30 text-xs">
              Live
            </Badge>
          </div>
          <p className="text-sm text-slate-500">Ecosystem intelligence across all 3 triads — 44 agents logging</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-28 bg-slate-800/50 border-slate-700/50 text-slate-300 text-sm h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="1d">24h</SelectItem>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={refetch}
            disabled={loading}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Global KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Actions",
            value: loading ? "—" : globalMetrics?.totalActions.toLocaleString() ?? "0",
            icon: Zap,
            color: "text-violet-400",
            bg: "bg-violet-500/10",
          },
          {
            label: "Success Rate",
            value: loading ? "—" : `${fmt(globalMetrics?.successRate)}%`,
            icon: CheckCircle,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
          },
          {
            label: "Avg Quality",
            value: loading ? "—" : `${fmt(globalMetrics?.avgQualityScore)}/10`,
            icon: Sparkles,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
          {
            label: "Total Cost",
            value: loading ? "—" : `$${fmt(globalMetrics?.totalCostUsd, 4)}`,
            icon: DollarSign,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">{kpi.label}</span>
                <div className={cn("p-1.5 rounded-md", kpi.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", kpi.color)} />
                </div>
              </div>
              <p className="text-2xl font-bold text-slate-100">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Triad Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {TRIADS.map((triad) => {
          const Icon = triad.icon;
          const data = getTriadData(triad.key);
          return (
            <button
              key={triad.key}
              onClick={() => navigate(triad.path)}
              className={cn(
                "text-left rounded-xl border p-5 bg-gradient-to-br transition-all hover:scale-[1.01] hover:shadow-xl group ring-1",
                triad.gradient, triad.border, triad.ring
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={cn("p-2 rounded-lg bg-slate-900/60 border", triad.border)}>
                    <Icon className={cn("w-4 h-4", triad.accent)} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">{triad.label}</h3>
                    <p className="text-xs text-slate-500">{triad.description}</p>
                  </div>
                </div>
                <ArrowRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity", triad.accent)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Actions", value: data?.totalActions.toLocaleString() ?? "—" },
                  { label: "Success", value: data ? `${fmt(data.successRate)}%` : "—" },
                  { label: "Quality", value: data ? `${fmt(data.avgQualityScore)}/10` : "—" },
                  { label: "Active", value: data?.activeAgents ? `${data.activeAgents} agents` : "—" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-900/40 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-500 mb-1">{stat.label}</p>
                    <p className={cn("text-sm font-semibold", triad.accent)}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom row: Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
          <h3 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-2">
            <BarChart2 className="w-3.5 h-3.5" /> Coverage
          </h3>
          <div className="space-y-2">
            {TRIADS.map(t => {
              const d = getTriadData(t.key);
              const total = globalMetrics?.totalActions ?? 1;
              const pct = d ? Math.round((d.totalActions / total) * 100) : 0;
              return (
                <div key={t.key} className="flex items-center gap-3">
                  <span className={cn("text-xs w-24 truncate", t.accent)}>{t.label}</span>
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full bg-current transition-all", t.accent)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
          <h3 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" /> Intelligence Summary
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Active agents logging</span>
              <span className="text-xs font-medium text-slate-200">44 / 44</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Unique tools tracked</span>
              <span className="text-xs font-medium text-slate-200">{globalMetrics?.uniqueTools ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Est. monthly savings</span>
              <span className="text-xs font-medium text-emerald-400">
                ${fmt((globalMetrics?.totalCostUsd ?? 0) * 0.72 * 4, 2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">Weekly report</span>
              <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 text-[10px]">
                Monday 2AM
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
