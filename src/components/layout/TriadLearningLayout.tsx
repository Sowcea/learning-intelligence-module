import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Brain, BarChart3, Users, Shield, Rocket,
  FileText, ChevronRight, ArrowLeft, Zap
} from "lucide-react";

const navItems = [
  { path: "/", label: "Overview", icon: Brain, color: "text-violet-400", active: "bg-violet-500/10 border-violet-500/30 text-violet-300" },
  { path: "/family", label: "Family Triad", icon: Users, color: "text-purple-400", active: "bg-purple-500/10 border-purple-500/30 text-purple-300" },
  { path: "/governance", label: "Governance Triad", icon: Shield, color: "text-blue-400", active: "bg-blue-500/10 border-blue-500/30 text-blue-300" },
  { path: "/rocket", label: "Rocket Triad", icon: Rocket, color: "text-orange-400", active: "bg-orange-500/10 border-orange-500/30 text-orange-300" },
  { path: "/reports", label: "Weekly Reports", icon: FileText, color: "text-emerald-400", active: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" },
];

export default function TriadLearningLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen bg-[#0a0a14] text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-slate-800/60 bg-[#0d0d1a] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-violet-500/15 border border-violet-500/25">
              <Brain className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-100">Learning Intelligence</h1>
              <p className="text-xs text-slate-500">Mother Brain V7</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-medium text-slate-600 uppercase tracking-wider px-3 mb-2 mt-1">Triads</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border",
                  isActive
                    ? item.active
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "" : item.color)} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-3 h-3 ml-auto opacity-60" />}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800/60">
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Triad Center
          </button>
          <div className="mt-2 px-3 py-2 rounded-lg bg-slate-800/30 flex items-center gap-2">
            <Zap className="w-3 h-3 text-violet-400" />
            <span className="text-[10px] text-slate-500">44 agents logging</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
