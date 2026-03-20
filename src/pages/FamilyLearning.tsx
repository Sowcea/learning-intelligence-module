import { useState } from "react";
import { useTriadLearning } from "@/hooks/useTriadLearning";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, CheckCircle, Clock, Sparkles, DollarSign, TrendingUp } from "lucide-react";

const FAMILY_AGENTS = [
  { name: "mother-brain-v5", label: "Mother Brain V5", role: "Central Orchestrator" },
  { name: "universe-agent", label: "Universe Agent", role: "General Intelligence" },
  { name: "marketing-agent", label: "Marketing Agent", role: "Growth & Campaigns" },
  { name: "tech-agent", label: "Tech Agent", role: "Engineering Support" },
  { name: "support-agent", label: "Support Agent", role: "Customer Care" },
  { name: "sales-agent", label: "Sales Agent", role: "Revenue Generation" },
  { name: "delivery-agent", label: "Delivery Agent", role: "Order & Logistics" },
  { name: "template-agent", label: "Template Agent", role: "Content Generation" },
];

export default function FamilyLearning() {
  const [timeRange, setTimeRange] = useState("7d");
  const { agentStats, triadMetrics, loading, refetch } = useTriadLearning(timeRange);

  const familyData = triadMetrics.find(t => t.triad === "family");
  const familyAgentStats = agentStats.filter(a => a.triad === "family");

  const fmt = (n: number | undefined, d = 1) => n !== undefined ? n.toFixed(d) : "—";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-purple-500/15 border border-purple-500/25">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
            <h1 className="text-xl font-semibold text-slate-100">Family Triad</h1>
            <Badge className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-xs">
              {familyData?.activeAgents ?? 8} agents
            </Badge>
          </div>
          <p className="text-sm text-slate-500">Commerce, marketing, support & delivery intelligence</p>
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

      {/* Triad KPIs */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Actions", value: familyData?.totalActions.toLocaleString() ?? "—", icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-500/10" },
          { label: "Success Rate", value: familyData ? `${fmt(familyData.successRate)}%` : "—", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Avg Quality", value: familyData ? `${fmt(familyData.avgQualityScore)}/10` : "—", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Total Cost", value: familyData ? `$${fmt(familyData.totalCostUsd, 4)}` : "—", icon: DollarSign, color: "text-rose-400", bg: "bg-rose-500/10" },
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

      {/* Agent Matrix */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Agent Performance Matrix</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {FAMILY_AGENTS.map((agent) => {
            const stats = familyAgentStats.find(s =>
              s.agent_name.toLowerCase().includes(agent.name.split("-")[0]) ||
              agent.name.toLowerCase().includes(s.agent_name.toLowerCase().split(" ")[0])
            );
            const hasData = stats && stats.total_actions > 0;
            return (
              <div key={agent.name}
                className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-4 hover:border-purple-500/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-200">{agent.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{agent.role}</p>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full mt-1",
                    hasData ? "bg-emerald-400" : "bg-slate-600")} />
                </div>
                {hasData ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Actions</span>
                      <span className="text-[10px] font-medium text-purple-400">{stats.total_actions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Success</span>
                      <span className="text-[10px] font-medium text-emerald-400">{fmt(stats.success_rate)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Quality</span>
                      <span className="text-[10px] font-medium text-amber-400">{fmt(stats.avg_quality)}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Avg time</span>
                      <span className="text-[10px] font-medium text-slate-400">{stats.avg_ms > 1000 ? `${(stats.avg_ms/1000).toFixed(1)}s` : `${Math.round(stats.avg_ms)}ms`}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-600">No data yet</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
