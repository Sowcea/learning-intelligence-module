import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Brain, ExternalLink, BarChart3, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LearningLayout() {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 border-r bg-muted/30 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/40">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-sm leading-none">Learning Brain</p>
              <p className="text-xs text-muted-foreground mt-0.5">Mother Brain V7</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn("flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                         : "text-muted-foreground hover:bg-muted hover:text-foreground")
            }
          >
            <BarChart3 className="h-4 w-4" />
            Learning Intelligence
          </NavLink>

          <NavLink
            to="/external"
            className={({ isActive }) =>
              cn("flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
                         : "text-muted-foreground hover:bg-muted hover:text-foreground")
            }
          >
            <ExternalLink className="h-4 w-4" />
            External Intelligence
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t">
          <a
            href="https://admin.sowcea.com"
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-3 w-3" />
            Back to Admin Panel
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
