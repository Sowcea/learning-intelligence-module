import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTriadLearning } from "@/hooks/useTriadLearning";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Shield, RefreshCw, CheckCircle, AlertTriangle, XCircle, Sparkles, Lock, Activity } from "lucide-react";

interface CircuitBreaker {
  service_name: string;
  state: string;
  failure_count: number;
  last_failure_at: string | null;
  last_success_at: string | null;
}

const GOV_AGENTS = [
  { name: "level-5-engine", label: "Level 5 Engine", role: "Autonomy Decision Engine" },
  { name: "security-sentinel", label: "Security Sentinel", role: "Threat Detection" },
  { name: "sos-healer", label: "SOS Healer", role: "Auto-Healing" },
];

const STATE_CONFIG: Record<string, { color: string; icon: any; bg: string; border: string }> = {
  closed: { color: "text-emerald-400", icon: CheckCircle, bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  open: { color: "text-red-400", icon: XCircle, bg: "bg-red-500/10", border: "border-red-500/30" },
  half_open: { color: "text-amber-400", icon: AlertTriangle, bg: "bg-amber-500/10", border: "border-amber-500/30" },
};

export default function GovernanceLearning() {
  const [timeRange, setTimeRange] = useState("7d");
  const { agentStats, triadMetrics, loading, refetch } = useTriadLearning(timeRange);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreaker[]>([]);
  const [cbLoading, setCbLoading] = useState(true);

  const govData = triadMetrics.find(t => t.triad === "governance");
  const govAgentStats = agentStats.filter(a => a.triad === "governance");
  const fmt = (n: number | undefined, d = 1) => n !== undefined ? n.toFixed(d) : "—";

  useEffect(() => {
    const fetchCB = async () => {
      setCbLoading(true);
      const { data } = await supabase.from("v6_circuit_breaker")
        .select("service_name, state, failure_count, last_failure_at, last_success_at")
        .order("service_name");
      if (data) setCircuitBreakers(data);
      setCbLoading(false);
    };
    fetchCB();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-blue-500/15 border border-blue-500/25">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <h1 className="text-xl font-semibold text-slate-100">Governance Triad</h1>
            <Badge className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-xs">
              Triple-Triad
            </Badge>
          </div>
          <p className="text-sm text-slate-500">Security, autonomy levels & circuit breaker intelligence</p>
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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Governance Actions", value: govData?.totalActions.toLocaleString() ?? "—", icon: Activity, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "Avg Quality", value: govData ? `${fmt(govData.avgQualityScore)}/10` : "—", icon: Sparkles, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "Circuit Breakers", value: circuitBreakers.filter(c => c.state === "closed").length + " / " + circuitBreakers.length, icon: Lock, color: "text-emerald-400", bg: "bg-emerald-500/10" },
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

      {/* Circuit Breakers */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
          <Lock className="w-3.5 h-3.5" /> Circuit Breakers
        </h2>
        {cbLoading ? (
          <div className="text-xs text-slate-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {circuitBreakers.map((cb) => {
              const cfg = STATE_CONFIG[cb.state] ?? STATE_CONFIG.closed;
              const Icon = cfg.icon;
              return (
                <div key={cb.service_name}
                  className={cn("rounded-xl border p-4 bg-slate-900/60 transition-colors", cfg.border)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-200 capitalize">
                      {cb.service_name.replace(/_/g, " ")}
                    </span>
                    <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", cfg.bg, cfg.color)}>
                      <Icon className="w-3 h-3" />
                      {cb.state.replace("_", " ")}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Failures</span>
                      <span className={cn("text-[10px] font-medium", cb.failure_count > 0 ? "text-red-400" : "text-slate-400")}>
                        {cb.failure_count}
                      </span>
                    </div>
                    {cb.last_success_at && (
                      <div className="flex justify-between">
                        <span className="text-[10px] text-slate-500">Last success</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(cb.last_success_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Agent Cards */}
      <div>
        <h2 className="text-sm font-medium text-slate-400 mb-3">Governance Agents</h2>
        <div className="grid grid-cols-3 gap-3">
          {GOV_AGENTS.map((agent) => {
            const stats = govAgentStats.find(s =>
              agent.name.split("-").some(part => s.agent_name.toLowerCase().includes(part))
            );
            const hasData = stats && stats.total_actions > 0;
            return (
              <div key={agent.name}
                className="bg-slate-900/60 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-medium text-slate-200">{agent.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{agent.role}</p>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full mt-1", hasData ? "bg-blue-400" : "bg-slate-600")} />
                </div>
                {hasData ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Actions</span>
                      <span className="text-[10px] font-medium text-blue-400">{stats.total_actions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Success</span>
                      <span className="text-[10px] font-medium text-emerald-400">{fmt(stats.success_rate)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-slate-500">Quality</span>
                      <span className="text-[10px] font-medium text-amber-400">{fmt(stats.avg_quality)}/10</span>
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
