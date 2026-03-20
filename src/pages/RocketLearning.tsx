import { useState } from "react";
import { useTriadLearning } from "@/hooks/useTriadLearning";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Rocket, RefreshCw, CheckCircle, Zap, Sparkles, Clock, TrendingUp } from "lucide-react";

const ROCKET_AGENTS = [
  { name: "n8n-orchestrator", label: "N8N Orchestrator", role: "Workflow Automation" },
  { name: "claude-code", label: "Claude Code Agent", role: "Code Intelligence" },
  { name: "openclaw", label: "OpenClaw Executor", role: "Task Execution" },
];

export default function RocketLearning() {
  const [timeRange, setTimeRange] = useState("7d");
  const { agentStats, triadMetrics, loading, refetch } = useTriadLearning(timeRange);

  const rocketData = triadMetrics.find(t => t.triad === "rocket");
  const rocketAgentStats = agentStats.filter(a => a.triad === "rocket");
  const fmt = (n: number | undefined, d = 1) => n !== undefined ? n.toFixed(d) : "—";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-orange-500/15 border border-orange-500/25">
              <Rocket className="w-4 h-4 text-orange-400" />
            </div>
            <h1 className="text-xl font-semibold text-slate-100">Rocket Triad</h1>
            <Badge className="bg-orange-500/15 text-orange-300 border border-orange-500/30 text-xs">
              Automation
            </Badge>
          </div>
          <p className="text-sm text-slate-500">n8n, Claude Code & OpenClaw automation intelligence</p>
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
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" onClick={refetch} disabled={loading}
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Actions", value: rocketData?.totalActions.toLocaleString() ?? "—", icon: Zap, color: "text-orange-400", bg: "bg-orange-500/10" },
          { label: "Success Rate", value: rocketData ? `${fmt(rocketData.successRate)}%` : "—", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Avg Quality", value: rocketData ? `${fmt(rocketData.avgQualityScore)}/10` : "—", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Avg Response", value: rocketData ? `${Math.round(rocketData.avgExecutionMs)}ms` : "—", icon: Clock, color: "text-sky-400", bg: "bg-sky-500/10" },
        ].map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">{k.label}</span>
                <div className={cn("p-1.5 rounded-md", k.bg)}>
                  <Icon className={cn("w-3.5 h-3.5", k.color)} />
                </div>
              </div>
              <p className="text-xl font-bold text-slate-100">{k.value}</p>
            </div>
          );
        })}
      </div>

      {/* Agent Cards */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Rocket Agents</h2>
        <div className="grid grid-cols-3 gap-4">
          {ROCKET_AGENTS.map((agent) => {
            const stats = rocketAgentStats.find(s =>
              agent.name.split("-").some(part => s.agent_name.toLowerCase().includes(part))
            );
            const hasData = stats && stats.total_actions > 0;
            return (
              <div key={agent.name}
                className="bg-slate-900/60 border border-orange-500/20 rounded-xl p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{agent.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{agent.role}</p>
                  </div>
                  <div className={cn("w-2.5 h-2.5 rounded-full mt-1",
                    hasData ? "bg-orange-400 shadow-sm shadow-orange-400/50" : "bg-slate-600")} />
                </div>
                {hasData ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Total Actions</span>
                      <span className="text-sm font-bold text-orange-400">{stats.total_actions.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-slate-800/60" />
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Success Rate</span>
                      <span className="text-xs font-medium text-emerald-400">{fmt(stats.success_rate)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Avg Quality</span>
                      <span className="text-xs font-medium text-amber-400">{fmt(stats.avg_quality)}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Avg Response</span>
                      <span className="text-xs font-medium text-sky-400">
                        {stats.avg_ms > 1000 ? `${(stats.avg_ms/1000).toFixed(1)}s` : `${Math.round(stats.avg_ms)}ms`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">Total Cost</span>
                      <span className="text-xs font-medium text-slate-400">${stats.total_cost.toFixed(4)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-600 mt-2">No data logged yet</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Automation summary */}
      <div className="bg-slate-900/60 border border-orange-500/15 rounded-xl p-4">
        <h3 className="text-xs font-medium text-slate-400 mb-3 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-orange-400" /> Automation Intelligence
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-slate-500 mb-1">n8n Workflows</p>
            <p className="text-sm font-bold text-orange-400">6 active</p>
            <p className="text-[10px] text-slate-600">Router, Health, Sync, Analytics...</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">OpenClaw Tasks</p>
            <p className="text-sm font-bold text-orange-400">Live</p>
            <p className="text-[10px] text-slate-600">Worker on VPS /opt/mother-brain/</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 mb-1">Learning Loop</p>
            <p className="text-sm font-bold text-emerald-400">Closed</p>
            <p className="text-[10px] text-slate-600">Weekly report every Monday 2AM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
